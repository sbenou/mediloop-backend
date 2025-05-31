
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);

  const authenticateWithLuxTrust = async (): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);
    
    try {
      console.log('Starting LuxTrust authentication...');
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('auth-service', {
        body: { 
          action: 'luxtrust_auth',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('LuxTrust authentication error:', error);
        throw error;
      }

      if (data?.success) {
        setAuthResponse(data);
        
        toast({
          title: 'LuxTrust Authentication Successful',
          description: 'Your professional credentials have been verified.',
        });

        return data;
      } else {
        throw new Error('Authentication failed');
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

  const clearAuth = () => {
    setAuthResponse(null);
  };

  return {
    authenticateWithLuxTrust,
    clearAuth,
    isAuthenticating,
    authResponse,
    isAuthenticated: !!authResponse?.success
  };
};
