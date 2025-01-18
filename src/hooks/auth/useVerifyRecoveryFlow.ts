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
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Current session state:", currentSession ? "Session exists" : "No session");

        // Log the full URL for debugging
        console.log("Current URL:", window.location.href);
        console.log("Search params:", window.location.search);
        console.log("Hash:", window.location.hash);
        
        // Extract and validate the OTP code
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");
        const email = queryParams.get("email");

        console.log("Recovery parameters:", {
          code: code ? "present" : "missing",
          email: email ? "present" : "missing"
        });

        if (!code || !email) {
          console.error("Missing required parameters");
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
          return;
        }

        // Verify the OTP
        console.log("Attempting OTP verification");
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: 'email'
        });

        if (verifyError) {
          console.error("OTP verification failed:", verifyError);
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

        console.log("OTP verification successful");
        setIsValidToken(true);
      } catch (error) {
        console.error("Unexpected error during recovery flow:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your reset link. Please try again.",
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

  return {
    isLoading,
    isValidToken
  };
};