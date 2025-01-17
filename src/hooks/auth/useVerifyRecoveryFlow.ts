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
      console.log("Current URL:", window.location.href);
      console.log("Search params:", window.location.search);
      console.log("Hash:", window.location.hash);

      try {
        // Check for active session first
        console.log("Checking for active session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("Session check result:", {
          hasSession: !!session,
          sessionError: sessionError?.message,
          sessionData: session
        });

        if (session) {
          console.log("Session is already valid, skipping OTP verification");
          setIsValidToken(true);
          setIsLoading(false);
          return;
        }

        // Extract and validate URL parameters
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = queryParams.get("code");
        const type = hashParams.get("type");

        console.log("Extracted parameters:", {
          code: code ? "present" : "missing",
          type,
          fullHash: window.location.hash,
          parsedHash: Object.fromEntries(hashParams.entries())
        });

        if (!code || type !== "recovery") {
          console.warn("Invalid recovery flow: Missing code or wrong type");
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Verify OTP if no valid session exists
        console.log("Attempting to verify OTP...");
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: "recovery"
          });

          if (verifyError) {
            console.error("OTP verification failed:", verifyError);
            throw verifyError;
          }
          console.log("OTP verification successful");
          setIsValidToken(true);
        } catch (verifyError) {
          console.error("OTP verification error:", verifyError);
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }
      } catch (error) {
        console.error("Unexpected error during recovery flow verification:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your reset link. Please try again.",
        });
        setIsValidToken(false);
        setTimeout(() => navigate("/login"), 3000);
      } finally {
        console.log("=== Reset Password Verification End ===");
        setIsLoading(false);
      }
    };

    verifyRecoveryFlow();
  }, [navigate, toast]);

  return { isLoading, isValidToken };
};