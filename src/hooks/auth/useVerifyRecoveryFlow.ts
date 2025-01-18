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
        console.log("Full URL:", window.location.href);
        
        // Extract and log all possible parameters
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        console.log("All URL query parameters:", Object.fromEntries(queryParams.entries()));
        console.log("All URL hash parameters:", Object.fromEntries(hashParams.entries()));
        
        // Get specific parameters we're interested in
        const code = queryParams.get("code");
        const type = hashParams.get("type");
        const error = queryParams.get("error");
        const error_description = queryParams.get("error_description");

        console.log("Extracted parameters:", {
          code: code ? "present" : "missing",
          type,
          error,
          error_description
        });

        // Check for error parameters first
        if (error || error_description) {
          console.error("Error in URL parameters:", { error, error_description });
          toast({
            variant: "destructive",
            title: "Error",
            description: error_description || "Invalid reset link",
          });
          setIsValidToken(false);
          return;
        }

        // If we already have a valid session, we can proceed
        if (currentSession?.user) {
          console.log("Valid session found, proceeding with reset");
          setIsValidToken(true);
          return;
        }

        // Verify the recovery token
        if (code) {
          console.log("Attempting to verify recovery token...");
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: "recovery"
          });

          if (verifyError) {
            console.error("Token verification failed:", verifyError);
            toast({
              variant: "destructive",
              title: "Invalid Reset Link",
              description: "The password reset link is invalid or has expired. Please request a new one.",
            });
            setIsValidToken(false);
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
            return;
          }

          console.log("Token verification successful");
          setIsValidToken(true);
        } else {
          console.error("No recovery code found in URL");
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is missing required parameters. Please request a new one.",
          });
          setIsValidToken(false);
        }
      } catch (error) {
        console.error("Unexpected error during recovery flow verification:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your reset link. Please try again.",
        });
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
        console.log("=== Reset Password Verification End ===");
      }
    };

    verifyRecoveryFlow();
  }, [navigate, toast]);

  return { isLoading, isValidToken };
};