import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AuthService } from "@/services/auth";

interface AuthOptionsProps {
  email: string;
  onBack: () => void;
}

export const AuthOptions = ({ email, onBack }: AuthOptionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleOTPSelection = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await AuthService.requestOtp(email);
      
      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
      });

      // Store email in localStorage for persistence
      localStorage.setItem('otp_email', email);

      // Navigate to OTP verification without replace to preserve history
      navigate("/login/verify", { 
        state: { email }
      });
      
    } catch (error: any) {
      console.error('OTP Process Failed:', error);
      
      let description = "Failed to send verification code";
      if (error.name === 'TypeError') {
        description = "Please check your internet connection and try again.";
      } else if (error.message?.includes('rate limit')) {
        description = "Too many attempts. Please wait a moment before trying again.";
      } else if (error.message?.includes('not found')) {
        description = "This email is not associated with an account.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLinkReset = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/new`,
      });

      if (error) throw error;

      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });

      navigate("/login", { replace: true });
    } catch (error: any) {
      let description = "Failed to send reset email";
      if (error.name === 'TypeError') {
        description = "Please check your internet connection and try again.";
      } else if (error.message?.includes('rate limit')) {
        description = "Too many attempts. Please wait a moment before trying again.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Reset Password</CardTitle>
        </div>
        <CardDescription>
          Choose how you would like to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleOTPSelection}
          className="w-full"
          variant="default"
          disabled={isLoading}
        >
          Reset with One-Time Code
        </Button>
        <Button
          onClick={handleEmailLinkReset}
          className="w-full"
          variant="outline"
          disabled={isLoading}
        >
          Reset with Email Link
        </Button>
      </CardContent>
    </Card>
  );
};