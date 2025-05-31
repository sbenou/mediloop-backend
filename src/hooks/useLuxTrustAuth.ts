
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

// Configuration for different environments
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:54327' // Supabase local edge functions
  : 'https://hrrlefgnhkbzuwyklejj.supabase.co/functions/v1'; // Supabase hosted functions

// This will be easy to change to your OVH endpoint later:
// const API_BASE_URL = 'https://your-ovh-backend.com/api';

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);

  const authenticateWithLuxTrust = async (): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);
    
    try {
      console.log('Starting LuxTrust authentication...');
      
      // Direct API call instead of supabase.functions.invoke
      const response = await fetch(`${API_BASE_URL}/auth-service/luxtrust/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any auth headers you need
        },
        body: JSON.stringify({ 
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
