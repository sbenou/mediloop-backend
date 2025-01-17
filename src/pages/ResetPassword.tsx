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
      console.log("=== Reset Password Verification Start ===");
      try {
        // Log the full URL for debugging
        console.log("Current URL:", window.location.href);
        
        // Extract query parameters and hash fragments
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Get the recovery code from query string and type from fragment
        const code = queryParams.get("code");
        const type = hashParams.get("type");
        
        console.log("Parsed Query Params:", { code: code ? "[REDACTED]" : null });
        console.log("Parsed Hash Params:", { type });

        if (!code || type !== "recovery") {
          console.warn("Invalid recovery flow: Missing code or wrong type");
          console.log("Type received:", type);
          console.log("Code present:", !!code);
          
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Verify the code using Supabase
        console.log("Verifying recovery code with Supabase...");
        const { data, error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: code
        });

        if (error) {
          console.error("Token verification error:", error.message);
          console.log("Error details:", {
            status: error.status,
            message: error.message
          });
          
          toast({
            variant: "destructive",
            title: "Invalid Reset Link",
            description: "The password reset link is invalid or has expired. Please request a new one.",
          });
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        console.log("Recovery code verification successful:", data);
        setIsValidToken(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Unexpected error during token verification:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your reset link. Please try again.",
        });
        setIsValidToken(false);
        setIsLoading(false);
      } finally {
        console.log("=== Reset Password Verification End ===");
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