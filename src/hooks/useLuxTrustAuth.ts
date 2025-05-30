
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { authClient } from '@/services/authClient';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: LuxTrustAuthResponse;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const pollJobStatus = async (jobId: string): Promise<LuxTrustAuthResponse | null> => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://reaeyxplttbuejktjrdh.supabase.co/functions/v1/auth-service/luxtrust/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const jobStatus: JobStatus = await response.json();
        console.log('Job status:', jobStatus.status, 'for job:', jobId);
        
        if (jobStatus.status === 'completed' && jobStatus.result) {
          return jobStatus.result;
        } else if (jobStatus.status === 'failed') {
          throw new Error(jobStatus.error || 'Authentication failed');
        }
        
        // Still processing, wait 1 second before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
      } catch (error) {
        console.error('Error polling job status:', error);
        throw error;
      }
    }
    
    throw new Error('Authentication timeout');
  };

  const authenticateWithLuxTrust = async (luxtrustId?: string): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);
    
    try {
      console.log('Starting LuxTrust authentication...');
      
      // Use provided ID or generate a test ID
      const idToUse = luxtrustId || 'TEST-LUX-ID-123456';
      
      // Start authentication job
      const response = await fetch('https://reaeyxplttbuejktjrdh.supabase.co/functions/v1/auth-service/luxtrust/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ luxtrustId: idToUse }),
      });

      if (!response.ok) {
        throw new Error(`Authentication request failed: ${response.status}`);
      }

      const { jobId } = await response.json();
      setCurrentJobId(jobId);
      console.log('Created authentication job:', jobId);

      // Poll for completion
      const result = await pollJobStatus(jobId);
      
      if (result) {
        setAuthResponse(result);
        
        toast({
          title: 'LuxTrust Authentication Successful',
          description: 'Your professional credentials have been verified.',
        });

        return result;
      }

      return null;
    } catch (error) {
      console.error('LuxTrust authentication error:', error);
      
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'LuxTrust authentication could not be completed.',
        variant: 'destructive'
      });

      return null;
    } finally {
      setIsAuthenticating(false);
      setCurrentJobId(null);
    }
  };

  const clearAuth = () => {
    setAuthResponse(null);
    setCurrentJobId(null);
  };

  return {
    authenticateWithLuxTrust,
    clearAuth,
    isAuthenticating,
    authResponse,
    currentJobId,
    isAuthenticated: !!authResponse?.success
  };
};
