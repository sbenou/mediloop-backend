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
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      console.log("=== Reset Password Session Check Start ===");
      try {
        // Check for active session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Session check result:", {
          hasSession: !!session,
          error: error?.message || null
        });

        if (error || !session) {
          console.warn("No active session found:", error?.message);
          toast({
            variant: "destructive",
            title: "Session Error",
            description: "Please use the reset link from your email to access this page.",
          });
          setIsValidSession(false);
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
          setIsValidSession(false);
          navigate("/login");
          return;
        }

        console.log("Valid recovery session found");
        setIsValidSession(true);

      } catch (error) {
        console.error("Unexpected error during session check:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your session. Please try again.",
        });
        setIsValidSession(false);
        navigate("/login");
      } finally {
        setIsLoading(false);
        console.log("=== Reset Password Session Check End ===");
      }
    };

    checkSession();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Verifying session...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Invalid Access</CardTitle>
            <CardDescription>
              Please use the reset link from your email to access this page.
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