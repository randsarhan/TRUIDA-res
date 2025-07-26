// Data storage and retrieval for TRUIDA system
import { PassengerData } from './biometric-utils';

const STORAGE_KEY = 'truida_passengers';
const STAFF_STORAGE_KEY = 'truida_staff_logs';

export interface StaffLogEntry {
  id: string;
  passengerId: string;
  checkpoint: 'security' | 'immigration' | 'boarding';
  timestamp: number;
  result: 'granted' | 'denied';
  staffId: string;
  notes?: string;
}

// Save passenger data
export const savePassengerData = (passenger: PassengerData): void => {
  try {
    const passengers = getAllPassengers();
    const existingIndex = passengers.findIndex(p => p.id === passenger.id);
    
    if (existingIndex >= 0) {
      passengers[existingIndex] = passenger;
    } else {
      passengers.push(passenger);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passengers));
    console.log('Passenger data saved:', passenger.id);
  } catch (error) {
    console.error('Error saving passenger data:', error);
    throw new Error('Failed to save passenger data');
  }
};

// Get all passengers
export const getAllPassengers = (): PassengerData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading passenger data:', error);
    return [];
  }
};

// Get passenger by ID
export const getPassengerById = (id: string): PassengerData | null => {
  const passengers = getAllPassengers();
  return passengers.find(p => p.id === id) || null;
};

// Get passenger by passport number
export const getPassengerByPassport = (passportNumber: string): PassengerData | null => {
  const passengers = getAllPassengers();
  return passengers.find(p => p.passportNumber === passportNumber) || null;
};

// Find passengers by biometric hash
export const findPassengersByBiometrics = (faceHash: string, fingerprintHash?: string): PassengerData[] => {
  const passengers = getAllPassengers();
  return passengers.filter(p => {
    const faceMatch = p.biometrics.faceHash === faceHash;
    const fingerprintMatch = fingerprintHash ? p.biometrics.fingerprintHash === fingerprintHash : true;
    return faceMatch && fingerprintMatch;
  });
};

// Update passenger checkpoint status
export const updateCheckpointStatus = (
  passengerId: string, 
  checkpoint: keyof PassengerData['checkpoints'],
  status: boolean
): boolean => {
  try {
    const passengers = getAllPassengers();
    const passenger = passengers.find(p => p.id === passengerId);
    
    if (!passenger) return false;
    
    passenger.checkpoints[checkpoint] = status;
    savePassengerData(passenger);
    return true;
  } catch (error) {
    console.error('Error updating checkpoint status:', error);
    return false;
  }
};

// Delete passenger data
export const deletePassengerData = (passengerId: string): boolean => {
  try {
    const passengers = getAllPassengers();
    const filteredPassengers = passengers.filter(p => p.id !== passengerId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPassengers));
    console.log('Passenger data deleted:', passengerId);
    return true;
  } catch (error) {
    console.error('Error deleting passenger data:', error);
    return false;
  }
};

// Clear all passenger data
export const clearAllPassengerData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STAFF_STORAGE_KEY);
    console.log('All passenger data cleared');
  } catch (error) {
    console.error('Error clearing passenger data:', error);
  }
};

// Auto-cleanup expired passengers (whose flights have departed)
export const cleanupExpiredPassengers = (): number => {
  try {
    const passengers = getAllPassengers();
    const now = new Date();
    const activePassengers = passengers.filter(p => {
      const departure = new Date(p.departureTime);
      return departure > now;
    });
    
    const deletedCount = passengers.length - activePassengers.length;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activePassengers));
    
    console.log(`Cleaned up ${deletedCount} expired passengers`);
    return deletedCount;
  } catch (error) {
    console.error('Error during cleanup:', error);
    return 0;
  }
};

// Staff logging functions
export const logCheckpointAccess = (entry: Omit<StaffLogEntry, 'id'>): void => {
  try {
    const logs = getStaffLogs();
    const logEntry: StaffLogEntry = {
      ...entry,
      id: crypto.randomUUID()
    };
    
    logs.push(logEntry);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error logging checkpoint access:', error);
  }
};

export const getStaffLogs = (): StaffLogEntry[] => {
  try {
    const data = localStorage.getItem(STAFF_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading staff logs:', error);
    return [];
  }
};

// Get statistics
export interface TruidaStats {
  totalEnrolled: number;
  totalActive: number;
  checkpointStats: {
    security: number;
    immigration: number;
    boarding: number;
  };
  recentActivity: StaffLogEntry[];
}

export const getTruidaStats = (): TruidaStats => {
  const passengers = getAllPassengers();
  const logs = getStaffLogs();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  return {
    totalEnrolled: passengers.length,
    totalActive: passengers.filter(p => new Date(p.departureTime) > now).length,
    checkpointStats: {
      security: passengers.filter(p => p.checkpoints.security).length,
      immigration: passengers.filter(p => p.checkpoints.immigration).length,
      boarding: passengers.filter(p => p.checkpoints.boarding).length
    },
    recentActivity: logs.filter(log => log.timestamp > oneHourAgo.getTime()).slice(-10)
  };
};