import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Shield, CheckCircle, XCircle, User, Clock, Plane } from 'lucide-react';
import { KioskButton } from '@/components/ui/kiosk-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  processFaceImage, 
  processFingerprintImage,
  loadImageFromFile,
  verifyBiometricMatch,
  isFlightValid,
  type PassengerData 
} from '@/lib/biometric-utils';
import { 
  findPassengersByBiometrics, 
  updateCheckpointStatus, 
  logCheckpointAccess 
} from '@/lib/data-store';

interface CheckpointStationProps {
  checkpoint: 'security' | 'immigration' | 'boarding';
  title: string;
  onComplete: () => void;
}

export const CheckpointStation: React.FC<CheckpointStationProps> = ({ 
  checkpoint, 
  title, 
  onComplete 
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    passenger?: PassengerData;
    message: string;
    similarity?: number;
  } | null>(null);
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('camera');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use file upload instead.",
        variant: "destructive"
      });
      setScanMethod('upload');
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const processVerification = async (faceHash: string, faceEmbedding: number[], fingerprintHash?: string) => {
    const candidates = findPassengersByBiometrics(faceHash, fingerprintHash);
    
    if (candidates.length === 0) {
      return {
        success: false,
        message: "No matching passenger found. Please verify your identity or enroll first."
      };
    }

    // Find best match based on face similarity
    let bestMatch = candidates[0];
    let bestSimilarity = 0;
    
    for (const candidate of candidates) {
      if (candidate.biometrics.faceEmbedding) {
        const verification = verifyBiometricMatch(
          candidate.biometrics,
          faceHash,
          fingerprintHash,
          faceEmbedding
        );
        
        if (verification.similarity > bestSimilarity) {
          bestSimilarity = verification.similarity;
          bestMatch = candidate;
        }
      }
    }

    // Check if flight is still valid
    if (!isFlightValid(bestMatch.departureTime)) {
      return {
        success: false,
        passenger: bestMatch,
        message: "Flight has already departed. Access denied.",
        similarity: bestSimilarity
      };
    }

    // Check checkpoint prerequisites
    if (checkpoint === 'immigration' && !bestMatch.checkpoints.security) {
      return {
        success: false,
        passenger: bestMatch,
        message: "Must clear security checkpoint first.",
        similarity: bestSimilarity
      };
    }

    if (checkpoint === 'boarding' && (!bestMatch.checkpoints.security || !bestMatch.checkpoints.immigration)) {
      return {
        success: false,
        passenger: bestMatch,
        message: "Must clear security and immigration checkpoints first.",
        similarity: bestSimilarity
      };
    }

    // Check if already passed this checkpoint
    if (bestMatch.checkpoints[checkpoint]) {
      return {
        success: true,
        passenger: bestMatch,
        message: "Already cleared this checkpoint. Access granted.",
        similarity: bestSimilarity
      };
    }

    // Success - grant access
    updateCheckpointStatus(bestMatch.id, checkpoint, true);
    
    // Log the access
    logCheckpointAccess({
      passengerId: bestMatch.id,
      checkpoint,
      timestamp: Date.now(),
      result: 'granted',
      staffId: 'SYSTEM',
      notes: `Similarity: ${(bestSimilarity * 100).toFixed(1)}%`
    });

    return {
      success: true,
      passenger: bestMatch,
      message: `Access granted. Welcome, ${bestMatch.firstName}!`,
      similarity: bestSimilarity
    };
  };

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await processFaceImage(img);
          const verification = await processVerification(result.hash, result.embedding);
          setVerificationResult(verification);
          stopCamera();
        } catch (error) {
          console.error('Error processing verification:', error);
          toast({
            title: "Verification Error",
            description: "Failed to process verification. Please try again.",
            variant: "destructive"
          });
        }
        setIsProcessing(false);
      };
      img.src = imageDataUrl;
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  }, [stopCamera, toast, checkpoint]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFromFile(file);
      const result = await processFaceImage(img);
      const verification = await processVerification(result.hash, result.embedding);
      setVerificationResult(verification);
    } catch (error) {
      console.error('Error processing uploaded image:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process uploaded image. Please try again.",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setScanMethod('camera');
    if (stream) stopCamera();
  };

  const getCheckpointIcon = () => {
    switch (checkpoint) {
      case 'security': return <Shield className="h-8 w-8" />;
      case 'immigration': return <User className="h-8 w-8" />;
      case 'boarding': return <Plane className="h-8 w-8" />;
    }
  };

  const getCheckpointColor = () => {
    switch (checkpoint) {
      case 'security': return 'text-destructive';
      case 'immigration': return 'text-warning';
      case 'boarding': return 'text-success';
    }
  };

  if (verificationResult) {
    return (
      <div className="min-h-screen bg-gradient-kiosk p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-primary mb-4">TRUIDA {title}</h1>
            <p className="text-xl text-muted-foreground">Verification Result</p>
          </div>

          <Card className={`w-full max-w-2xl mx-auto shadow-kiosk border-2 ${
            verificationResult.success ? 'border-success' : 'border-destructive'
          }`}>
            <CardHeader className="text-center">
              <CardTitle className={`text-3xl font-bold flex items-center justify-center gap-3 ${
                verificationResult.success ? 'text-success' : 'text-destructive'
              }`}>
                {verificationResult.success ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
                {verificationResult.success ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-xl mb-6">{verificationResult.message}</p>
                
                {verificationResult.passenger && (
                  <div className="bg-muted p-6 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="font-semibold">Passenger</p>
                        <p>{verificationResult.passenger.firstName} {verificationResult.passenger.lastName}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Flight</p>
                        <p>{verificationResult.passenger.flightNumber} - Gate {verificationResult.passenger.gate}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Departure</p>
                        <p>{new Date(verificationResult.passenger.departureTime).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Match Confidence</p>
                        <p>{((verificationResult.similarity || 0) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="font-semibold mb-2">Checkpoint Status</p>
                      <div className="flex gap-2">
                        <Badge variant={verificationResult.passenger.checkpoints.security ? "default" : "secondary"}>
                          Security: {verificationResult.passenger.checkpoints.security ? 'Cleared' : 'Pending'}
                        </Badge>
                        <Badge variant={verificationResult.passenger.checkpoints.immigration ? "default" : "secondary"}>
                          Immigration: {verificationResult.passenger.checkpoints.immigration ? 'Cleared' : 'Pending'}
                        </Badge>
                        <Badge variant={verificationResult.passenger.checkpoints.boarding ? "default" : "secondary"}>
                          Boarding: {verificationResult.passenger.checkpoints.boarding ? 'Cleared' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <KioskButton
                  variant="outline"
                  onClick={resetVerification}
                >
                  Scan Another Passenger
                </KioskButton>
                <KioskButton
                  onClick={onComplete}
                  variant={verificationResult.success ? "success" : "default"}
                >
                  Continue
                </KioskButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-kiosk p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={`text-5xl font-bold mb-4 ${getCheckpointColor()}`}>
            TRUIDA {title}
          </h1>
          <p className="text-xl text-muted-foreground">Present for Biometric Verification</p>
        </div>

        <Card className="w-full max-w-2xl mx-auto shadow-kiosk">
          <CardHeader className="text-center">
            <CardTitle className={`text-3xl font-bold flex items-center justify-center gap-3 ${getCheckpointColor()}`}>
              {getCheckpointIcon()}
              Verify Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Please provide a face scan for verification.
              </p>
              
              <div className="flex gap-4 justify-center mb-6">
                <KioskButton
                  variant={scanMethod === 'camera' ? 'default' : 'outline'}
                  onClick={() => setScanMethod('camera')}
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </KioskButton>
                <KioskButton
                  variant={scanMethod === 'upload' ? 'default' : 'outline'}
                  onClick={() => setScanMethod('upload')}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </KioskButton>
              </div>

              {scanMethod === 'camera' ? (
                <div className="relative mx-auto w-80 h-60 bg-muted rounded-lg overflow-hidden border-2 border-primary">
                  <video
                    ref={videoRef}
                    autoPlay
                    className="w-full h-full object-cover"
                    onLoadedMetadata={startCamera}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary rounded-lg p-8 mx-auto w-80">
                  <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
                  <Label htmlFor="face-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-primary">Click to upload face image</span>
                    <Input
                      id="face-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <KioskButton
                variant="outline"
                onClick={onComplete}
                disabled={isProcessing}
              >
                Back to Menu
              </KioskButton>
              {scanMethod === 'camera' && (
                <KioskButton
                  onClick={captureAndVerify}
                  disabled={isProcessing || !stream}
                  size="lg"
                >
                  {isProcessing ? 'Verifying...' : 'Verify Identity'}
                </KioskButton>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};