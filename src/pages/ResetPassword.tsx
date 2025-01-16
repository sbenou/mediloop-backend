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

  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log("Hash params:", { type, hasAccessToken: !!accessToken });
        
        if (!accessToken || type !== 'recovery') {
          console.log("Invalid recovery flow");
          throw new Error("Invalid reset password link");
        }

        // Set the session with the access token
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Reset token error:", error);
        toast({
          variant: "destructive",
          title: "Invalid Reset Link",
          description: "Please use the reset password link from your email or request a new one.",
          duration: 5000,
        });
        navigate('/login');
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