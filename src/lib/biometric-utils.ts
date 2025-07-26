// Biometric data processing and hashing utilities
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Types for biometric data
export interface BiometricData {
  faceHash: string;
  fingerprintHash: string;
  faceEmbedding?: number[];
  timestamp: number;
}

export interface PassengerData {
  id: string;
  passportNumber: string;
  firstName: string;
  lastName: string;
  flightNumber: string;
  gate: string;
  departureTime: string;
  biometrics: BiometricData;
  enrollmentTime: number;
  checkpoints: {
    security: boolean;
    immigration: boolean;
    boarding: boolean;
  };
  guardianId?: string; // For minors/PRM passengers
}

// Utility functions for hashing
export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate UUID for passenger ID
export const generatePassengerId = (): string => {
  return 'TRU-' + crypto.randomUUID();
};

// Face detection and feature extraction
export const processFaceImage = async (imageElement: HTMLImageElement): Promise<{ hash: string; embedding: number[] }> => {
  try {
    console.log('Processing face image...');
    
    // Create canvas to get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);
    
    // Convert to base64 for processing
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Use a simple feature extraction pipeline for face embeddings
    const extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2', // Using a general purpose model
      { device: 'webgpu' }
    );
    
    // For demo purposes, we'll create a simple hash based on image data
    // In production, you'd use proper face recognition models
    const hash = await hashData(imageData);
    
    // Generate mock embedding for demo (in production, use proper face embeddings)
    const embedding = Array.from({length: 384}, () => Math.random());
    
    console.log('Face processing completed');
    return { hash, embedding };
  } catch (error) {
    console.error('Error processing face image:', error);
    // Fallback: create hash from image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const hash = await hashData(imageData);
      const embedding = Array.from({length: 384}, () => Math.random());
      return { hash, embedding };
    }
    throw error;
  }
};

// Process fingerprint (simulated with image upload)
export const processFingerprintImage = async (imageElement: HTMLImageElement): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg', 0.8);
  return await hashData(imageData);
};

// Calculate similarity between face embeddings
export const calculateFaceSimilarity = (embedding1: number[], embedding2: number[]): number => {
  if (embedding1.length !== embedding2.length) return 0;
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

// Verify biometric match
export const verifyBiometricMatch = (
  storedBiometrics: BiometricData,
  currentFaceHash: string,
  currentFingerprintHash?: string,
  currentFaceEmbedding?: number[]
): { faceMatch: boolean; fingerprintMatch: boolean; similarity: number } => {
  const faceMatch = storedBiometrics.faceHash === currentFaceHash;
  const fingerprintMatch = currentFingerprintHash ? 
    storedBiometrics.fingerprintHash === currentFingerprintHash : true;
  
  let similarity = 0;
  if (currentFaceEmbedding && storedBiometrics.faceEmbedding) {
    similarity = calculateFaceSimilarity(storedBiometrics.faceEmbedding, currentFaceEmbedding);
  }
  
  return { faceMatch, fingerprintMatch, similarity };
};

// Load image from file
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Check if flight is still valid (not departed)
export const isFlightValid = (departureTime: string): boolean => {
  const departure = new Date(departureTime);
  const now = new Date();
  return departure > now;
};

// Auto-delete expired passenger data
export const cleanupExpiredData = (passengers: PassengerData[]): PassengerData[] => {
  return passengers.filter(passenger => isFlightValid(passenger.departureTime));
};