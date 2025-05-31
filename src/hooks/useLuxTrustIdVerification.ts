
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

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
      console.log('Using local Deno backend for ID verification');
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

export type IdVerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed';

export const useLuxTrustIdVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<IdVerificationStatus>('unverified');

  const verifyLuxTrustId = async (luxtrustId: string) => {
    if (!luxtrustId.trim()) {
      toast({
        title: 'LuxTrust ID Required',
        description: 'Please enter a LuxTrust ID first.',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('verifying');

    try {
      console.log('Starting LuxTrust ID verification for:', luxtrustId);
      
      const apiBaseUrl = await getApiBaseUrl();
      // Use the existing luxtrust-service function
      const endpoint = apiBaseUrl.includes('localhost:8000') 
        ? `${apiBaseUrl}/luxtrust/verify-id`
        : `${apiBaseUrl}/functions/v1/luxtrust-service/verify-id`;

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
        body: JSON.stringify({ luxtrustId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.status === 'verified') {
        setVerificationStatus('verified');
        toast({
          title: 'LuxTrust ID Verified',
          description: `Your LuxTrust ID has been successfully verified. Verification ID: ${data.verificationId}`,
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: 'Verification Failed',
          description: data.error || 'Could not verify this LuxTrust ID. Please check and try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('LuxTrust ID verification failed:', error);
      setVerificationStatus('failed');
      toast({
        title: 'Verification Failed',
        description: 'Could not verify this LuxTrust ID. Please check and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setVerificationStatus('unverified');
  };

  return {
    verifyLuxTrustId,
    resetVerification,
    isVerifying,
    verificationStatus
  };
};
