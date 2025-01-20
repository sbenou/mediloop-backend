import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { OTPVerificationForm } from './OTPVerificationForm';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get email from multiple sources
  const getEmail = () => {
    // Try to get email from location state first
    const stateEmail = location.state?.email;
    if (stateEmail) return stateEmail;

    // Fallback to localStorage
    const storedEmail = localStorage.getItem('otp_email');
    const expiryTime = localStorage.getItem('otp_email_expiry');

    if (storedEmail && expiryTime) {
      const expiry = parseInt(expiryTime);
      if (new Date().getTime() <= expiry) {
        return storedEmail;
      }
    }

    return null;
  };

  useEffect(() => {
    const checkSession = async () => {
      // Check for expired OTP email
      const email = getEmail();
      if (!email) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please start the password reset process again.",
        });
        navigate('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Clear OTP data if user is already authenticated
        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');
        navigate('/', { replace: true });
      }
    };
    checkSession();
  }, [navigate, toast]);

  const email = getEmail();

  if (!email) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            No Email Found
          </h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find your email address. Please try the verification process again.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the verification code sent to {email}
        </p>
      </div>
      <OTPVerificationForm email={email} />
    </div>
  );
};