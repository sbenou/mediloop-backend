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
    const verifyRecoveryToken = async () => {
      try {
        // Log the full URL hash for debugging
        console.log("Full URL Hash:", window.location.hash);

        // Extract hash parameters from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const token_hash = hashParams.get('token_hash');
        const type = hashParams.get('type');

        console.log("Reset password flow - Hash params:", { token_hash: token_hash ? '[REDACTED]' : null, type });
        
        if (!token_hash || type !== 'recovery') {
          console.log("Invalid recovery flow - Missing token_hash or wrong type");
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Verify the token using Supabase with token_hash
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        });

        if (error) {
          console.error("Recovery token verification error:", error);
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        console.log("Recovery token verified successfully:", data);
        setIsValidToken(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error during recovery token verification:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your reset link. Please try again.",
        });
        setIsValidToken(false);
        setIsLoading(false);
      }
    };

    verifyRecoveryToken();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Verifying reset link...</CardTitle>
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
              onClick={() => navigate('/login')}
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
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;