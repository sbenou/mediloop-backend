
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
      
      // Call the LuxTrust service without requiring authentication
      const { data, error } = await supabase.functions.invoke('luxtrust-service', {
        body: { 
          action: 'auth',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('LuxTrust service error:', error);
        toast({
          title: 'LuxTrust Error',
          description: `Authentication failed: ${error.message}`,
          variant: 'destructive'
        });
        return null;
      }

      if (data?.success) {
        console.log('LuxTrust authentication successful:', data);
        setAuthResponse(data);
        toast({
          title: 'LuxTrust Success',
          description: 'Authentication completed successfully!',
          variant: 'default'
        });
        return data;
      } else {
        console.error('LuxTrust authentication failed:', data);
        toast({
          title: 'LuxTrust Failed',
          description: 'Authentication was not successful',
          variant: 'destructive'
        });
        return null;
      }
    } catch (error) {
      console.error('LuxTrust authentication failed:', error);
      toast({
        title: 'LuxTrust Error',
        description: 'Failed to connect to authentication service',
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
