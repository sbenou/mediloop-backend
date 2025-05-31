
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
      
      // Use Supabase client to invoke the luxtrust-service function
      const { data, error } = await supabase.functions.invoke('luxtrust-service', {
        body: { 
          action: 'auth',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (data?.success) {
        setAuthResponse(data);
        return data;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('LuxTrust authentication failed:', error);
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
