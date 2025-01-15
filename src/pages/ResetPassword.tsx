import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ResetPasswordForm } from "@/components/auth/reset-password/ResetPasswordForm";

const ResetPassword = () => {
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