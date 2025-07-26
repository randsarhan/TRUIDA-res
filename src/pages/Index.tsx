import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { EnrollmentStation } from '@/components/EnrollmentStation';
import { CheckpointStation } from '@/components/CheckpointStation';
import { StaffDashboard } from '@/components/StaffDashboard';
import { cleanupExpiredPassengers } from '@/lib/data-store';
import { type PassengerData } from '@/lib/biometric-utils';

type Screen = 'menu' | 'enroll' | 'security' | 'immigration' | 'boarding' | 'dashboard';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  // Auto-cleanup expired passengers on app start
  useEffect(() => {
    cleanupExpiredPassengers();
  }, []);

  const handleNavigate = (screen: 'enroll' | 'security' | 'immigration' | 'boarding' | 'dashboard') => {
    setCurrentScreen(screen);
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleEnrollmentComplete = (passenger: PassengerData) => {
    // Could show a success screen or redirect to next checkpoint
    setCurrentScreen('menu');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MainMenu onNavigate={handleNavigate} />;
      case 'enroll':
        return <EnrollmentStation onEnrollmentComplete={handleEnrollmentComplete} />;
      case 'security':
        return (
          <CheckpointStation
            checkpoint="security"
            title="Security Checkpoint"
            onComplete={handleBackToMenu}
          />
        );
      case 'immigration':
        return (
          <CheckpointStation
            checkpoint="immigration"
            title="Immigration"
            onComplete={handleBackToMenu}
          />
        );
      case 'boarding':
        return (
          <CheckpointStation
            checkpoint="boarding"
            title="Boarding Gate"
            onComplete={handleBackToMenu}
          />
        );
      case 'dashboard':
        return <StaffDashboard onBack={handleBackToMenu} />;
      default:
        return <MainMenu onNavigate={handleNavigate} />;
    }
  };

  return renderCurrentScreen();
};

export default Index;
