
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

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
      
      // Use Supabase client to invoke the luxtrust-service function
      const { data, error } = await supabase.functions.invoke('luxtrust-service', {
        body: { 
          action: 'verify-id',
          luxtrustId: luxtrustId
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (data?.success && data.status === 'verified') {
        setVerificationStatus('verified');
        toast({
          title: 'LuxTrust ID Verified',
          description: `Your LuxTrust ID has been successfully verified. Verification ID: ${data.verificationId}`,
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: 'Verification Failed',
          description: data?.error || 'Could not verify this LuxTrust ID. Please check and try again.',
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
