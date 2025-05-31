
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { LuxTrustAuthResponse } from '@/types/luxembourg';

// Check if local Deno backend is running, fallback to Supabase
const getApiBaseUrl = async () => {
  // In Lovable preview environment, always use production Supabase
  if (window.location.hostname.includes('lovableproject.com')) {
    console.log('Using production Supabase edge function in Lovable preview');
    return 'https://hrrlefgnhkbzuwyklejj.supabase.co';
  }
  
  try {
    // Try local Deno backend first (only in true local development)
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
  
  // Fallback to Supabase luxtrust-service
  return import.meta.env.DEV 
    ? 'http://localhost:54321' 
    : 'https://hrrlefgnhkbzuwyklejj.supabase.co';
};

export const useLuxTrustAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResponse, setAuthResponse] = useState<LuxTrustAuthResponse | null>(null);

  const authenticateWithLuxTrust = async (): Promise<LuxTrustAuthResponse | null> => {
    setIsAuthenticating(true);
    
    try {
      console.log('Starting LuxTrust authentication...');
      
      const apiBaseUrl = await getApiBaseUrl();
      // Use the existing luxtrust-service function
      const endpoint = apiBaseUrl.includes('localhost:8000') 
        ? `${apiBaseUrl}/luxtrust/auth`
        : `${apiBaseUrl}/functions/v1/luxtrust-service/auth`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Supabase headers when using Supabase edge functions
      if (!apiBaseUrl.includes('localhost:8000')) {
        headers['apikey'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers,
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
