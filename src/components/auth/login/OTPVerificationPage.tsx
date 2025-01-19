import { useLocation, useNavigate } from 'react-router-dom';
import { OTPVerificationForm } from './OTPVerificationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const RESEND_COOLDOWN = 60; // 60 seconds cooldown

export const OTPVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = location.state?.email;
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    console.log('OTPVerificationPage mounted with state:', location.state);
    
    if (!email) {
      console.log('No email found in state, redirecting to login');
      toast({
        variant: "destructive",
        title: "Invalid Access",
        description: "Please request a verification code first.",
      });
      navigate('/login');
    }
  }, [email, navigate, location.state, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending || !email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });

      if (error) throw error;

      setResendCooldown(RESEND_COOLDOWN);
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      console.error('Failed to resend OTP:', error);
      let description = "Failed to resend verification code";
      
      if (error.name === 'TypeError') {
        description = "Please check your internet connection and try again.";
      } else if (error.message?.includes('rate limit')) {
        description = "Too many attempts. Please wait a moment before trying again.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Access</CardTitle>
          <CardDescription>
            Please request a verification code first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Verification Code</CardTitle>
        <CardDescription>
          We've sent a verification code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OTPVerificationForm email={email} />
        <Button
          onClick={handleResendOTP}
          variant="outline"
          className="w-full"
          disabled={resendCooldown > 0 || isResending}
        >
          {resendCooldown > 0
            ? `Resend Code (${resendCooldown}s)`
            : isResending
            ? "Sending..."
            : "Resend Code"}
        </Button>
      </CardContent>
    </Card>
  );
};