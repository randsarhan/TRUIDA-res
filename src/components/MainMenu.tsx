import React from 'react';
import { UserPlus, Shield, User, Plane, Monitor, Settings } from 'lucide-react';
import { KioskButton } from '@/components/ui/kiosk-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MainMenuProps {
  onNavigate: (screen: 'enroll' | 'security' | 'immigration' | 'boarding' | 'dashboard') => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-kiosk p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-primary mb-6">TRUIDA</h1>
          <p className="text-2xl text-muted-foreground mb-4">Smart Biometric Identity System</p>
          <p className="text-lg text-muted-foreground">
            Touchless • Paperless • Seamless Airport Experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Passenger Enrollment */}
          <Card className="shadow-kiosk border-2 border-transparent hover:border-primary transition-all cursor-pointer group" 
                onClick={() => onNavigate('enroll')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                <UserPlus className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl text-primary">Passenger Enrollment</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Register your biometric identity with passport and flight details for seamless travel.
              </p>
              <KioskButton size="lg" className="w-full">
                Start Enrollment
              </KioskButton>
            </CardContent>
          </Card>

          {/* Security Checkpoint */}
          <Card className="shadow-kiosk border-2 border-transparent hover:border-destructive transition-all cursor-pointer group"
                onClick={() => onNavigate('security')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive rounded-full flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                <Shield className="h-8 w-8 text-destructive-foreground" />
              </div>
              <CardTitle className="text-2xl text-destructive">Security Checkpoint</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Verify your identity for security clearance using biometric scanning.
              </p>
              <KioskButton variant="destructive" size="lg" className="w-full">
                Security Scan
              </KioskButton>
            </CardContent>
          </Card>

          {/* Immigration */}
          <Card className="shadow-kiosk border-2 border-transparent hover:border-warning transition-all cursor-pointer group"
                onClick={() => onNavigate('immigration')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-warning rounded-full flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                <User className="h-8 w-8 text-warning-foreground" />
              </div>
              <CardTitle className="text-2xl text-warning">Immigration</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Complete immigration formalities with automated biometric verification.
              </p>
              <KioskButton 
                style={{ 
                  backgroundColor: 'hsl(var(--warning))', 
                  color: 'hsl(var(--warning-foreground))' 
                }} 
                size="lg" 
                className="w-full"
              >
                Immigration Check
              </KioskButton>
            </CardContent>
          </Card>

          {/* Boarding Gate */}
          <Card className="shadow-kiosk border-2 border-transparent hover:border-success transition-all cursor-pointer group"
                onClick={() => onNavigate('boarding')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                <Plane className="h-8 w-8 text-success-foreground" />
              </div>
              <CardTitle className="text-2xl text-success">Boarding Gate</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Board your flight with instant biometric verification at the gate.
              </p>
              <KioskButton variant="success" size="lg" className="w-full">
                Board Flight
              </KioskButton>
            </CardContent>
          </Card>

          {/* Staff Dashboard */}
          <Card className="shadow-kiosk border-2 border-transparent hover:border-accent transition-all cursor-pointer group"
                onClick={() => onNavigate('dashboard')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4 group-hover:shadow-glow transition-all">
                <Monitor className="h-8 w-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl text-accent">Staff Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Monitor system status, passenger flow, and access comprehensive analytics.
              </p>
              <KioskButton 
                style={{ 
                  backgroundColor: 'hsl(var(--accent))', 
                  color: 'hsl(var(--accent-foreground))' 
                }} 
                size="lg" 
                className="w-full"
              >
                Staff Access
              </KioskButton>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="shadow-kiosk border-2 border-muted">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl text-muted-foreground">System Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Advanced facial recognition</li>
                <li>✓ Encrypted biometric storage</li>
                <li>✓ Real-time verification</li>
                <li>✓ Privacy-compliant design</li>
                <li>✓ Automatic data cleanup</li>
                <li>✓ Multi-checkpoint support</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p className="text-sm">
            TRUIDA v1.0 • Powered by Advanced Biometric Technology
          </p>
          <p className="text-xs mt-2">
            Your privacy is protected. All biometric data is hashed and automatically deleted after departure.
          </p>
        </div>
      </div>
    </div>
  );
};