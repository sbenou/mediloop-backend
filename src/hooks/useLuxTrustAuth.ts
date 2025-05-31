
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

// Check if local Deno backend is running, fallback to Supabase
const getApiBaseUrl = async () => {
  try {
    // Try local Deno backend first
    const localResponse = await fetch('http://localhost:8000/health', {
      method: 'GET',
      mode: 'cors'
    });
    if (localResponse.ok) {
      console.log('Using local Deno backend');
      return 'http://localhost:8000';
    }
  } catch (error) {
    console.log('Local Deno backend not available, using Supabase');
  }
  
  // Fallback to Supabase (corrected local development URL)
  return import.meta.env.DEV 
    ? 'http://localhost:54321' 
    : 'https://hrrlefgnhkbzuwyklejj.supabase.co/functions/v1';
};

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);

  const authenticateWithLuxTrust = async (): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);
    
    try {
      console.log('Starting LuxTrust authentication...');
      
      const apiBaseUrl = await getApiBaseUrl();
      const endpoint = apiBaseUrl.includes('localhost:8000') 
        ? `${apiBaseUrl}/luxtrust/auth`
        : `${apiBaseUrl}/functions/v1/auth-service/luxtrust/auth`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
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
