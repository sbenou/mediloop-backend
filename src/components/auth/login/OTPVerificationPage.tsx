import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { OTPVerificationForm } from './OTPVerificationForm';
import { toast } from '@/components/ui/use-toast';

export const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleVerification = async (otp: string) => {
    try {
      setIsVerifying(true);
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');

      if (!email) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Email not found in URL parameters",
        });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email verified successfully. Redirecting...",
      });

      // Add a small delay before redirecting to ensure the auth state is updated
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);

    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the verification code sent to your email
        </p>
      </div>
      <OTPVerificationForm 
        onSubmit={handleVerification}
        isLoading={isVerifying}
      />
    </div>
  );
};