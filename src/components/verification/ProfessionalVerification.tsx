
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { professionalVerificationService } from '@/services/professionalVerification';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalVerificationProps {
  userRole: 'doctor' | 'pharmacist' | 'nurse';
  onVerificationComplete: (verified: boolean, data?: any) => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
  };
}

export const ProfessionalVerification = ({ 
  userRole, 
  onVerificationComplete, 
  initialData 
}: ProfessionalVerificationProps) => {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [country, setCountry] = useState<'france' | 'luxembourg'>('france');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!firstName || !lastName || !licenseNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await professionalVerificationService.verifyProfessional(
        firstName,
        lastName,
        licenseNumber,
        userRole,
        country
      );

      setVerificationResult(result);

      if (result.isVerified) {
        toast({
          title: 'Verification Successful',
          description: result.message,
        });
        onVerificationComplete(true, result);
      } else {
        toast({
          title: 'Verification Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Verification Error',
        description: 'An error occurred during verification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerification = () => {
    // Allow user to proceed with manual verification
    onVerificationComplete(false, {
      requiresManualVerification: true,
      submittedData: { firstName, lastName, licenseNumber, country }
    });
  };

  const getStatusIcon = () => {
    if (!verificationResult) return null;
    
    if (verificationResult.isVerified) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getConfidenceBadge = () => {
    if (!verificationResult) return null;
    
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[verificationResult.confidence]}>
        {verificationResult.confidence} confidence
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Professional Verification
          {getStatusIcon()}
        </CardTitle>
        <CardDescription>
          Verify your professional credentials to access all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Professional License Number</Label>
          <Input
            id="licenseNumber"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Enter your license number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={country} onValueChange={(value: 'france' | 'luxembourg') => setCountry(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="france">France</SelectItem>
              <SelectItem value="luxembourg">Luxembourg</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {verificationResult && (
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Verification Result</span>
              {getConfidenceBadge()}
            </div>
            <p className="text-sm text-muted-foreground">{verificationResult.message}</p>
            <p className="text-xs text-muted-foreground">
              Method: {verificationResult.verificationMethod}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Credentials'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleManualVerification}
            className="flex-1"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Manual Verification
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p>• Automatic verification available for France (RPPS) and Luxembourg</p>
          <p>• Manual verification may take 24-48 hours for approval</p>
          <p>• All data is encrypted and handled according to GDPR requirements</p>
        </div>
      </CardContent>
    </Card>
  );
};
