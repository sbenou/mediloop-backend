import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useVerifyRecoveryFlow = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyRecoveryFlow = async () => {
      console.log("=== Reset Password Verification Start ===");
      try {
        // Get current session first
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        console.log("Session check result:", { 
          hasSession: !!currentSession,
          sessionError: sessionError?.message || 'none'
        });

        // Extract the recovery code
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");
        console.log("Recovery code from URL:", code ? "present" : "missing");

        if (!code) {
          console.error("No recovery code found in URL");
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is missing required parameters. Please request a new one.",
          });
          setIsValidToken(false);
          navigate("/login");
          return;
        }

        // If we already have a valid session, we can proceed
        if (currentSession?.user) {
          console.log("Valid session found, proceeding with reset");
          setIsValidToken(true);
          setIsLoading(false);
          return;
        }

        console.log("Attempting OTP verification with code");
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token: code,
          type: "recovery"
        });

        console.log("Verification response:", {
          success: !!data.session,
          error: verifyError?.message || 'none'
        });

        if (verifyError) {
          console.error("Verification failed:", verifyError);
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          navigate("/login");
          return;
        }

        if (!data.session) {
          console.error("No session after verification");
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "Failed to establish session. Please try again.",
          });
          setIsValidToken(false);
          navigate("/login");
          return;
        }

        console.log("Verification successful, session established");
        setIsValidToken(true);

      } catch (error) {
        console.error("Unexpected error during verification:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        });
        setIsValidToken(false);
        navigate("/login");
      } finally {
        setIsLoading(false);
        console.log("=== Reset Password Verification End ===");
      }
    };

    verifyRecoveryFlow();
  }, [navigate, toast]);

  return { isLoading, isValidToken };
};