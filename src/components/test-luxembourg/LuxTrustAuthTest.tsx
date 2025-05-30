
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { LuxTrustProfile } from './types';

interface LuxTrustAuthTestProps {
  isLuxembourg: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  luxtrustProfile: LuxTrustProfile | null;
  onAuthenticate: () => void;
}

export const LuxTrustAuthTest: React.FC<LuxTrustAuthTestProps> = ({
  isLuxembourg,
  isAuthenticating,
  isAuthenticated,
  luxtrustProfile,
  onAuthenticate
}) => {
  const testLuxTrustAuth = async () => {
    onAuthenticate();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'LuxTrust Authentication Successful',
      description: 'Professional credentials verified successfully!'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          LuxTrust Authentication Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <Button
            onClick={testLuxTrustAuth}
            disabled={isAuthenticating || !isLuxembourg}
            className="w-full"
          >
            {isAuthenticating ? (
              <>Authenticating with LuxTrust...</>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Authenticate with LuxTrust
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button variant="outline" disabled className="w-full">
              <FileCheck className="mr-2 h-4 w-4 text-green-600" />
              LuxTrust Verified
            </Button>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Name:</strong> {luxtrustProfile?.firstName} {luxtrustProfile?.lastName}
              </p>
              <p className="text-sm text-green-800">
                <strong>Professional ID:</strong> {luxtrustProfile?.professionalId}
              </p>
              <p className="text-sm text-green-800">
                <strong>Level:</strong> {luxtrustProfile?.certificationLevel}
              </p>
            </div>
          </div>
        )}

        {!isLuxembourg && (
          <p className="text-sm text-muted-foreground text-center">
            LuxTrust authentication is only available for Luxembourg users
          </p>
        )}
      </CardContent>
    </Card>
  );
};
