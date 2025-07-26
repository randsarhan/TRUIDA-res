import React, { useState, useEffect } from 'react';
import { Monitor, Users, Shield, User, Plane, Clock, Trash2, RefreshCw } from 'lucide-react';
import { KioskButton } from '@/components/ui/kiosk-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllPassengers, 
  getStaffLogs, 
  getTruidaStats, 
  cleanupExpiredPassengers,
  clearAllPassengerData,
  type TruidaStats,
  type StaffLogEntry 
} from '@/lib/data-store';
import { type PassengerData } from '@/lib/biometric-utils';

interface StaffDashboardProps {
  onBack: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<TruidaStats | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [logs, setLogs] = useState<StaffLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'passengers' | 'logs'>('overview');

  const refreshData = () => {
    setStats(getTruidaStats());
    setPassengers(getAllPassengers());
    setLogs(getStaffLogs().slice(-50).reverse()); // Show latest 50 logs
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCleanup = () => {
    const deletedCount = cleanupExpiredPassengers();
    toast({
      title: "Cleanup Complete",
      description: `Removed ${deletedCount} expired passenger records.`,
      variant: "default"
    });
    refreshData();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL passenger data? This action cannot be undone.')) {
      clearAllPassengerData();
      toast({
        title: "Data Cleared",
        description: "All passenger data has been permanently deleted.",
        variant: "destructive"
      });
      refreshData();
    }
  };

  const getCheckpointBadge = (checkpoint: keyof PassengerData['checkpoints'], status: boolean) => {
    const colors = {
      security: status ? 'default' : 'destructive',
      immigration: status ? 'default' : 'secondary', 
      boarding: status ? 'default' : 'outline'
    };
    
    return (
      <Badge variant={colors[checkpoint] as any}>
        {checkpoint.charAt(0).toUpperCase() + checkpoint.slice(1)}: {status ? 'Cleared' : 'Pending'}
      </Badge>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-kiosk">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalEnrolled || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-kiosk">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Passengers</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.totalActive || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-kiosk">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Cleared</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.checkpointStats.security || 0}</div>
          </CardContent>
        </Card>

        <Card className="shadow-kiosk">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boarded</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.checkpointStats.boarding || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-kiosk">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((log) => {
                const passenger = passengers.find(p => p.id === log.passengerId);
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">
                        {passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Unknown Passenger'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.checkpoint.charAt(0).toUpperCase() + log.checkpoint.slice(1)} checkpoint
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.result === 'granted' ? 'default' : 'destructive'}>
                        {log.result.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPassengers = () => (
    <Card className="shadow-kiosk">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Passengers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {passengers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Flight</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Checkpoints</TableHead>
                <TableHead>Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{passenger.firstName} {passenger.lastName}</p>
                      <p className="text-sm text-muted-foreground">{passenger.passportNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{passenger.flightNumber}</p>
                      <p className="text-sm text-muted-foreground">Gate {passenger.gate}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(passenger.departureTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getCheckpointBadge('security', passenger.checkpoints.security)}
                      {getCheckpointBadge('immigration', passenger.checkpoints.immigration)}
                      {getCheckpointBadge('boarding', passenger.checkpoints.boarding)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(passenger.enrollmentTime).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-8">No passengers enrolled</p>
        )}
      </CardContent>
    </Card>
  );

  const renderLogs = () => (
    <Card className="shadow-kiosk">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Access Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Checkpoint</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const passenger = passengers.find(p => p.id === log.passengerId);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.checkpoint.charAt(0).toUpperCase() + log.checkpoint.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.result === 'granted' ? 'default' : 'destructive'}>
                        {log.result.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.notes}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-8">No access logs</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-kiosk p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold text-primary mb-4">TRUIDA Staff Dashboard</h1>
            <p className="text-xl text-muted-foreground">System Monitoring & Management</p>
          </div>
          <div className="flex gap-4">
            <KioskButton onClick={refreshData} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </KioskButton>
            <KioskButton onClick={onBack} variant="outline">
              Back to Menu
            </KioskButton>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <KioskButton
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </KioskButton>
          <KioskButton
            variant={activeTab === 'passengers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('passengers')}
          >
            Passengers
          </KioskButton>
          <KioskButton
            variant={activeTab === 'logs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('logs')}
          >
            Access Logs
          </KioskButton>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'passengers' && renderPassengers()}
        {activeTab === 'logs' && renderLogs()}

        <div className="mt-8 flex gap-4 justify-center">
          <KioskButton onClick={handleCleanup} variant="secondary">
            <Trash2 className="h-4 w-4" />
            Cleanup Expired
          </KioskButton>
          <KioskButton onClick={handleClearAll} variant="destructive">
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </KioskButton>
        </div>
      </div>
    </div>
  );
};