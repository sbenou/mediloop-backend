import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ResetPasswordForm } from "@/components/auth/reset-password/ResetPasswordForm";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Check URL query parameters first
        const searchParams = new URLSearchParams(window.location.search);
        let accessToken = searchParams.get('access_token');
        let type = searchParams.get('type');

        // If not in query params, check hash
        if (!accessToken) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          type = hashParams.get('type');
        }

        console.log("Reset password flow - URL params:", { type, hasAccessToken: !!accessToken });
        
        if (!accessToken) {
          console.log("Invalid recovery flow - Missing token");
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        const { data: { user }, error: sessionError } = await supabase.auth.getUser(accessToken);

        if (sessionError || !user) {
          console.error("Session error or no user:", sessionError);
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Set the session with the access token
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });

        console.log("Reset password flow - Valid token, user found:", user.email);
        setIsValidToken(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Reset token verification error:", error);
        setIsValidToken(false);
        setIsLoading(false);
      }
    };

    checkResetToken();
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