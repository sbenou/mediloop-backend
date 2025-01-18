import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ResetPasswordForm } from "@/components/auth/reset-password/ResetPasswordForm";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

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
        
        // Extract and validate the recovery code
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get("code");

        console.log("Recovery code:", code ? "present" : "missing");

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
          return;
        }

        // Verify the recovery token
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

        console.log("Token verification successful");
        setIsValidToken(true);
      } catch (error) {
        console.error("Unexpected error during recovery flow verification:", error);
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

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Verifying reset link...</CardTitle>
            <CardDescription>Please wait while we verify your reset link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one from the login page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Return to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;