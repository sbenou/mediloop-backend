
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

interface PendingVerification {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  licenseNumber: string;
  country: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[];
}

export const ProfessionalVerificationManagement = () => {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setIsLoading(true);
      // Mock data - in production, fetch from your API
      const mockData: PendingVerification[] = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'Dr. Jean Dupont',
          email: 'jean.dupont@example.com',
          role: 'doctor',
          licenseNumber: '12345678901',
          country: 'france',
          submittedAt: new Date().toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'Marie Martin',
          email: 'marie.martin@example.com',
          role: 'pharmacist',
          licenseNumber: 'LU123456',
          country: 'luxembourg',
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending'
        }
      ];
      setPendingVerifications(mockData);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending verifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (verificationId: string) => {
    try {
      // In production, call your API to approve the verification
      setPendingVerifications(prev => 
        prev.map(v => 
          v.id === verificationId 
            ? { ...v, status: 'approved' as const }
            : v
        )
      );

      toast({
        title: 'Verification Approved',
        description: 'Professional credentials have been approved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve verification',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (verificationId: string) => {
    try {
      // In production, call your API to reject the verification
      setPendingVerifications(prev => 
        prev.map(v => 
          v.id === verificationId 
            ? { ...v, status: 'rejected' as const }
            : v
        )
      );

      toast({
        title: 'Verification Rejected',
        description: 'Professional credentials have been rejected',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject verification',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Verification Management</CardTitle>
        <CardDescription>
          Review and approve professional credential verifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Professional</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>License Number</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading verifications...
                </TableCell>
              </TableRow>
            ) : pendingVerifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No pending verifications found
                </TableCell>
              </TableRow>
            ) : (
              pendingVerifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{verification.userName}</div>
                      <div className="text-sm text-muted-foreground">{verification.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{verification.role}</TableCell>
                  <TableCell>{verification.licenseNumber}</TableCell>
                  <TableCell className="capitalize">{verification.country}</TableCell>
                  <TableCell>{getStatusBadge(verification.status)}</TableCell>
                  <TableCell>
                    {new Date(verification.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVerification(verification)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Professional Verification</DialogTitle>
                            <DialogDescription>
                              Verify the professional credentials for {verification.userName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Name</label>
                                <p className="text-sm text-muted-foreground">{verification.userName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Role</label>
                                <p className="text-sm text-muted-foreground capitalize">{verification.role}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">License Number</label>
                                <p className="text-sm text-muted-foreground">{verification.licenseNumber}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Country</label>
                                <p className="text-sm text-muted-foreground capitalize">{verification.country}</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Verification Notes</label>
                              <p className="text-sm text-muted-foreground">
                                Manual verification required - automatic verification could not confirm credentials
                              </p>
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleReject(verification.id)}
                              disabled={verification.status !== 'pending'}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(verification.id)}
                              disabled={verification.status !== 'pending'}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
