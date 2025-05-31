
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const authenticateWithLuxTrust = async (): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);
    setJobId(null);
    
    try {
      // Use the correct Supabase project URL
      const response = await fetch('https://reaeyxplttbuejktjrdh.supabase.co/functions/v1/auth-service/luxtrust/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          luxtrustId: 'TEST-LUX-ID-123456',
          testMode: true
        })
      });

      const result = await response.json();
      
      if (result.jobId) {
        setJobId(result.jobId);
        
        // Poll for results
        const authResult = await pollAuthStatus(result.jobId);
        setAuthResponse(authResult);
        
        if (authResult) {
          toast({
            title: 'LuxTrust Authentication Successful',
            description: 'Your professional credentials have been verified.',
          });
        }

        return authResult;
      } else {
        throw new Error('Failed to create authentication job');
      }
    } catch (error) {
      console.error('LuxTrust authentication failed:', error);
      
      toast({
        title: 'Authentication Failed',
        description: 'LuxTrust authentication could not be completed.',
        variant: 'destructive'
      });

      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const pollAuthStatus = async (authJobId: string): Promise<LuxTrustAuthResponse | null> => {
    const maxAttempts = 30; // 30 seconds
    let attempts = 0;

    return new Promise((resolve) => {
      const poll = async () => {
        try {
          // Use the correct Supabase project URL
          const response = await fetch(`https://reaeyxplttbuejktjrdh.supabase.co/functions/v1/auth-service/luxtrust/status/${authJobId}`);
          const result = await response.json();

          if (result.status === 'completed' && result.profile) {
            const authResponse: LuxTrustAuthResponse = {
              success: true,
              profile: result.profile,
              signature: result.signature || `LuxTrust-Signature-${Date.now()}`,
              timestamp: new Date().toISOString(),
              verificationId: result.verificationId || `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            };
            resolve(authResponse);
            return;
          } else if (result.status === 'failed') {
            resolve(null);
            return;
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 1000);
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Polling error:', error);
          resolve(null);
        }
      };

      poll();
    });
  };

  const clearAuth = () => {
    setAuthResponse(null);
    setJobId(null);
  };

  return {
    authenticateWithLuxTrust,
    clearAuth,
    isAuthenticating,
    authResponse,
    jobId,
    isAuthenticated: !!authResponse?.success
  };
};
