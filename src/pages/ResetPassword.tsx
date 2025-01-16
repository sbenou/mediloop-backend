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
  const [isValidReset, setIsValidReset] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      // Get the hash fragment from the URL
      const hash = location.hash;
      
      if (!hash) {
        console.log("No hash fragment found in URL");
        toast({
          variant: "destructive",
          title: "Invalid Access",
          description: "Please use the reset password link from your email.",
        });
        navigate('/login');
        return;
      }

      try {
        // Verify the recovery token
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          throw error;
        }

        if (data.session) {
          console.log("Valid reset token found");
          setIsValidReset(true);
        }
      } catch (error: any) {
        console.error("Error verifying reset token:", error);
        toast({
          variant: "destructive",
          title: "Invalid or Expired Link",
          description: "The password reset link is invalid or has expired. Please request a new one.",
        });
        navigate('/login');
      }
    };

    handlePasswordReset();
  }, [navigate, location, toast]);

  if (!isValidReset) {
    return null; // Don't render anything while validating
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
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