
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:54327'
  : 'https://hrrlefgnhkbzuwyklejj.supabase.co/functions/v1';

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
      
      const response = await fetch(`${API_BASE_URL}/auth-service/luxtrust/verify-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
