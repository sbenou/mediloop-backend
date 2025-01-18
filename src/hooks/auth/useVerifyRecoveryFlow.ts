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
        console.log("Current session:", currentSession);

        // Extract and validate URL parameters
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = queryParams.get("code");
        const type = hashParams.get("type");

        console.log("Current URL:", window.location.href);
        console.log("Search params:", window.location.search);
        console.log("Hash:", window.location.hash);
        console.log("Extracted parameters:", {
          code: code ? "present" : "missing",
          type,
        });

        if (!code || type !== "recovery") {
          console.warn("Invalid recovery flow parameters");
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          // Removed navigation to login - let user stay on reset password page
          return;
        }

        // If we already have a valid session, skip OTP verification
        if (currentSession?.user) {
          console.log("Valid session found, proceeding with reset");
          setIsValidToken(true);
          return;
        }

        // Verify OTP only if we don't have a valid session
        console.log("Attempting to verify OTP...");
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: "recovery"
        });

        if (verifyError) {
          console.error("OTP verification failed:", verifyError);
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          // Removed navigation to login - let user stay on reset password page
          return;
        }

        // Check if we got a session after OTP verification
        if (!data.session) {
          console.error("No session after OTP verification");
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "Failed to establish session. Please try again.",
          });
          setIsValidToken(false);
          // Removed navigation to login - let user stay on reset password page
          return;
        }

        console.log("OTP verification successful, session established");
        setIsValidToken(true);
      } catch (error) {
        console.error("Unexpected error during recovery flow verification:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your reset link. Please try again.",
        });
        setIsValidToken(false);
        // Removed navigation to login - let user stay on reset password page
      } finally {
        setIsLoading(false);
        console.log("=== Reset Password Verification End ===");
      }
    };

    verifyRecoveryFlow();
  }, [navigate, toast]);

  return { isLoading, isValidToken };
};