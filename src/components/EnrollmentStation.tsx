import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, User, Plane, Clock, Shield, CheckCircle } from 'lucide-react';
import { KioskButton } from '@/components/ui/kiosk-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  generatePassengerId, 
  processFaceImage, 
  processFingerprintImage,
  loadImageFromFile,
  type PassengerData 
} from '@/lib/biometric-utils';
import { savePassengerData } from '@/lib/data-store';

interface EnrollmentStationProps {
  onEnrollmentComplete: (passenger: PassengerData) => void;
}

export const EnrollmentStation: React.FC<EnrollmentStationProps> = ({ onEnrollmentComplete }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState<'info' | 'face' | 'fingerprint' | 'complete'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceData, setFaceData] = useState<{ hash: string; embedding: number[] } | null>(null);
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    passportNumber: '',
    flightNumber: '',
    gate: '',
    departureTime: ''
  });

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
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
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
      
      // Convert canvas to image element for processing
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await processFaceImage(img);
          setFaceData(result);
          stopCamera();
          setCurrentStep('fingerprint');
          toast({
            title: "Face Captured",
            description: "Face scan completed successfully.",
            variant: "default"
          });
        } catch (error) {
          console.error('Error processing face:', error);
          toast({
            title: "Processing Error",
            description: "Failed to process face scan. Please try again.",
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
  }, [stopCamera, toast]);

  const handleFingerprintUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFromFile(file);
      const hash = await processFingerprintImage(img);
      setFingerprintHash(hash);
      setCurrentStep('complete');
      toast({
        title: "Fingerprint Processed",
        description: "Fingerprint scan completed successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing fingerprint:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process fingerprint. Please try again.",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const completeEnrollment = async () => {
    if (!faceData || !fingerprintHash) {
      toast({
        title: "Incomplete Data",
        description: "Please complete all biometric scans.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const passenger: PassengerData = {
        id: generatePassengerId(),
        ...formData,
        biometrics: {
          faceHash: faceData.hash,
          fingerprintHash,
          faceEmbedding: faceData.embedding,
          timestamp: Date.now()
        },
        enrollmentTime: Date.now(),
        checkpoints: {
          security: false,
          immigration: false,
          boarding: false
        }
      };

      savePassengerData(passenger);
      onEnrollmentComplete(passenger);
      
      toast({
        title: "Enrollment Complete",
        description: `Welcome to TRUIDA, ${passenger.firstName}! Your biometric profile has been created.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error completing enrollment:', error);
      toast({
        title: "Enrollment Error",
        description: "Failed to complete enrollment. Please try again.",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const renderInfoStep = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-kiosk">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
          <User className="h-8 w-8" />
          Passenger Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-lg font-medium">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="h-12 text-lg"
              placeholder="Enter first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-lg font-medium">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="h-12 text-lg"
              placeholder="Enter last name"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="passport" className="text-lg font-medium">Passport Number</Label>
          <Input
            id="passport"
            value={formData.passportNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value }))}
            className="h-12 text-lg"
            placeholder="Enter passport number"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="flight" className="text-lg font-medium flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Flight Number
            </Label>
            <Input
              id="flight"
              value={formData.flightNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
              className="h-12 text-lg"
              placeholder="EK123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gate" className="text-lg font-medium">Gate</Label>
            <Input
              id="gate"
              value={formData.gate}
              onChange={(e) => setFormData(prev => ({ ...prev, gate: e.target.value }))}
              className="h-12 text-lg"
              placeholder="A12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departure" className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Departure
            </Label>
            <Input
              id="departure"
              type="datetime-local"
              value={formData.departureTime}
              onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
              className="h-12 text-lg"
            />
          </div>
        </div>

        <KioskButton
          size="lg"
          onClick={() => setCurrentStep('face')}
          disabled={!formData.firstName || !formData.lastName || !formData.passportNumber || !formData.flightNumber}
          className="w-full"
        >
          Continue to Face Scan
        </KioskButton>
      </CardContent>
    </Card>
  );

  const renderFaceStep = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-kiosk">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
          <Camera className="h-8 w-8" />
          Face Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-6">
            Please position your face in the camera frame and click capture when ready.
          </p>
          
          <div className="relative mx-auto w-80 h-60 bg-muted rounded-lg overflow-hidden border-2 border-primary">
            <video
              ref={videoRef}
              autoPlay
              className="w-full h-full object-cover"
              onLoadedMetadata={startCamera}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <KioskButton
            variant="outline"
            onClick={() => setCurrentStep('info')}
            disabled={isProcessing}
          >
            Back
          </KioskButton>
          <KioskButton
            onClick={capturePhoto}
            disabled={isProcessing || !stream}
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Capture Face'}
          </KioskButton>
        </div>
      </CardContent>
    </Card>
  );

  const renderFingerprintStep = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-kiosk">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
          <Shield className="h-8 w-8" />
          Fingerprint Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-6">
            Please upload a fingerprint image for verification.
          </p>
          
          <div className="border-2 border-dashed border-primary rounded-lg p-8">
            <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
            <Label htmlFor="fingerprint" className="cursor-pointer">
              <span className="text-lg font-medium text-primary">Click to upload fingerprint image</span>
              <Input
                id="fingerprint"
                type="file"
                accept="image/*"
                onChange={handleFingerprintUpload}
                className="hidden"
              />
            </Label>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <KioskButton
            variant="outline"
            onClick={() => setCurrentStep('face')}
            disabled={isProcessing}
          >
            Back
          </KioskButton>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-kiosk">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-success flex items-center justify-center gap-3">
          <CheckCircle className="h-8 w-8" />
          Enrollment Ready
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-6">
            All biometric data has been captured successfully. Review your information and complete enrollment.
          </p>
          
          <div className="bg-muted p-4 rounded-lg text-left space-y-2">
            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
            <p><strong>Passport:</strong> {formData.passportNumber}</p>
            <p><strong>Flight:</strong> {formData.flightNumber} - Gate {formData.gate}</p>
            <p><strong>Departure:</strong> {new Date(formData.departureTime).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <KioskButton
            variant="outline"
            onClick={() => setCurrentStep('fingerprint')}
            disabled={isProcessing}
          >
            Back
          </KioskButton>
          <KioskButton
            variant="success"
            size="lg"
            onClick={completeEnrollment}
            disabled={isProcessing}
          >
            {isProcessing ? 'Enrolling...' : 'Complete Enrollment'}
          </KioskButton>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-kiosk p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-4">TRUIDA Enrollment</h1>
          <p className="text-xl text-muted-foreground">Smart Biometric Identity System</p>
        </div>

        {currentStep === 'info' && renderInfoStep()}
        {currentStep === 'face' && renderFaceStep()}
        {currentStep === 'fingerprint' && renderFingerprintStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
};