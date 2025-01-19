import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { OTPVerificationForm } from './OTPVerificationForm';
import { toast } from '@/components/ui/use-toast';

export const OTPVerificationPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // Get email from URL parameters
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');

  if (!email) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Error
          </h1>
          <p className="text-sm text-muted-foreground">
            No email address found. Please try logging in again.
          </p>
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
          Enter the verification code sent to your email
        </p>
      </div>
      <OTPVerificationForm email={email} />
    </div>
  );
};