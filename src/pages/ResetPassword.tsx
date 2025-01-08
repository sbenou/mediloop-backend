import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ResetPasswordForm } from "@/components/auth/reset-password/ResetPasswordForm";

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for recovery code on mount
  useEffect(() => {
    const recoveryDataStr = sessionStorage.getItem('recovery_data');
    if (!recoveryDataStr) {
      toast({
        variant: "destructive",
        title: "Invalid Access",
        description: "Please use the reset password link from your email.",
      });
      navigate('/login');
      return;
    }

    const recoveryData = JSON.parse(recoveryDataStr);
    const isExpired = Date.now() - recoveryData.timestamp > 60 * 60 * 1000; // 1 hour
    
    if (isExpired) {
      sessionStorage.removeItem('recovery_data');
      toast({
        variant: "destructive",
        title: "Link Expired",
        description: "The password reset link has expired. Please request a new one.",
      });
      navigate('/login');
    }
  }, [navigate, toast]);

  const handlePasswordReset = async (password: string) => {
    setIsLoading(true);

    try {
      const recoveryDataStr = sessionStorage.getItem('recovery_data');
      if (!recoveryDataStr) {
        throw new Error('Recovery code not found');
      }

      const recoveryData = JSON.parse(recoveryDataStr);
      const { code } = recoveryData;

      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: code,
        type: 'recovery'
      });

      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      sessionStorage.removeItem('recovery_data');

      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in with your new password.",
        duration: 5000,
      });
      
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
      });
      
      if (error.message.includes('expired')) {
        sessionStorage.removeItem('recovery_data');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <ResetPasswordForm onSubmit={handlePasswordReset} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;