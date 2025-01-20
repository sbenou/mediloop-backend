import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { OTPVerificationForm } from './OTPVerificationForm';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const OTPVerificationPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for expired OTP email
    const expiryTime = localStorage.getItem('otp_email_expiry');
    if (expiryTime && new Date().getTime() > parseInt(expiryTime)) {
      localStorage.removeItem('otp_email');
      localStorage.removeItem('otp_email_expiry');
      navigate('/login');
      return;
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Clear OTP data if user is already authenticated
        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');
        navigate('/', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // Get email from localStorage
  const email = localStorage.getItem('otp_email');

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