import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ResetPasswordForm } from "@/components/auth/reset-password/ResetPasswordForm";
import { supabase } from "@/lib/supabase";
import { User } from '@supabase/supabase-js';

// Extend the User type to include recovery-specific properties
interface RecoveryUser extends User {
  aal?: string;
  amr?: Array<{ method: string }>;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const verifyRecoveryFlow = async () => {
      console.log("=== Reset Password Verification Start ===");
      try {
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
          navigate("/login");
          return;
        }

        // Verify OTP
        console.log("Attempting to verify OTP...");
        const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
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
          navigate("/login");
          return;
        }

        // Check session after OTP verification
        if (!session) {
          console.error("No session after OTP verification");
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "Failed to establish session. Please try again.",
          });
          setIsValidToken(false);
          navigate("/login");
          return;
        }

        // Cast the user to our extended type
        const user = session.user as RecoveryUser;

        // Verify this is a recovery session
        const recoveryFlow = user?.aal?.includes('recovery') || 
                           user?.amr?.some(method => method.method === 'recovery');

        console.log("Recovery flow check:", { 
          recoveryFlow, 
          aal: user?.aal, 
          amr: user?.amr 
        });

        if (!recoveryFlow) {
          console.warn("Not a recovery session");
          toast({
            variant: "destructive",
            title: "Invalid Access",
            description: "This page can only be accessed through a password reset link.",
          });
          setIsValidToken(false);
          navigate("/login");
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