import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader } from "lucide-react";
import { useState } from "react";
import { AuthService } from "@/services/auth";

interface AuthOptionsProps {
  email: string;
  onBack: () => void;
}

export const AuthOptions = ({ email, onBack }: AuthOptionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOTPLoading, setIsOTPLoading] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const handleOTPSelection = async () => {
    if (isOTPLoading) return;

    setIsOTPLoading(true);
    try {
      console.log("Requesting OTP for:", email);
      
      await AuthService.requestOtp(email);
      
      // Store email in localStorage with a 15-minute expiration
      const expirationTime = new Date().getTime() + (15 * 60 * 1000);
      localStorage.setItem('otp_email', email);
      localStorage.setItem('otp_email_expiry', expirationTime.toString());

      console.log("Navigating to /login/verify with email:", email);
      
      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
      });

      // Navigate with state
      navigate("/login/verify", { 
        state: { email },
        replace: true // Use replace to prevent back navigation issues
      });
      
    } catch (error: any) {
      console.error('OTP Process Failed:', error);
      
      let description = "Unable to send verification code. ";
      if (error.name === 'TypeError') {
        description += "Please check your internet connection and try again.";
      } else if (error.message?.includes('not found')) {
        description = "This email is not associated with an account.";
      } else if (error.message?.includes('rate limit')) {
        description = "Too many attempts. Please try again in a few minutes.";
      } else {
        description += "Please try again later.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    } finally {
      setIsOTPLoading(false);
    }
  };

  const handleEmailLinkReset = async () => {
    if (isLinkLoading) return;

    setIsLinkLoading(true);
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
      let description = "Unable to send reset email. ";
      if (error.name === 'TypeError') {
        description += "Please check your internet connection and try again.";
      } else if (error.message?.includes('rate limit')) {
        description = "Too many attempts. Please try again in a few minutes.";
      } else {
        description += "Please try again later.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    } finally {
      setIsLinkLoading(false);
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
          disabled={isOTPLoading || isLinkLoading}
        >
          {isOTPLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isOTPLoading ? "Sending..." : "Reset with One-Time Code"}
        </Button>
        <Button
          onClick={handleEmailLinkReset}
          className="w-full"
          variant="outline"
          disabled={isOTPLoading || isLinkLoading}
        >
          {isLinkLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLinkLoading ? "Sending..." : "Reset with Email Link"}
        </Button>
      </CardContent>
    </Card>
  );
};