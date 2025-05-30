
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileCheck, Clock } from 'lucide-react';
import { useLuxTrustAuth } from '@/hooks/useLuxTrustAuth';
import type { LuxTrustProfile } from './types';

interface LuxTrustAuthTestProps {
  isLuxembourg: boolean;
}

export const LuxTrustAuthTest: React.FC<LuxTrustAuthTestProps> = ({
  isLuxembourg
}) => {
  const { 
    authenticateWithLuxTrust, 
    isAuthenticating, 
    isAuthenticated, 
    authResponse,
    currentJobId,
    clearAuth
  } = useLuxTrustAuth();

  const handleAuthenticate = async () => {
    await authenticateWithLuxTrust();
  };

  const handleReset = () => {
    clearAuth();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          LuxTrust Authentication Test (Deno KV Queue)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="space-y-3">
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating || !isLuxembourg}
              className="w-full"
            >
              {isAuthenticating ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing Authentication...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Authenticate with LuxTrust
                </>
              )}
            </Button>
            
            {currentJobId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Job ID:</strong> {currentJobId}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Processing authentication request in queue...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Button variant="outline" disabled className="w-full">
              <FileCheck className="mr-2 h-4 w-4 text-green-600" />
              LuxTrust Verified (Queue Processed)
            </Button>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Name:</strong> {authResponse?.profile?.firstName} {authResponse?.profile?.lastName}
              </p>
              <p className="text-sm text-green-800">
                <strong>Professional ID:</strong> {authResponse?.profile?.professionalId}
              </p>
              <p className="text-sm text-green-800">
                <strong>Level:</strong> {authResponse?.profile?.certificationLevel}
              </p>
              <p className="text-sm text-green-800">
                <strong>Verification ID:</strong> {authResponse?.verificationId}
              </p>
            </div>
            
            <Button onClick={handleReset} variant="outline" className="w-full">
              Reset Authentication
            </Button>
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
