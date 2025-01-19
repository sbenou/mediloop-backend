import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AuthOptionsProps {
  email: string;
  onSelectOTP: () => void;
}

export const AuthOptions = ({ email, onSelectOTP }: AuthOptionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOTPSelection = async () => {
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log('Sending login email with OTP:', { email, otp });
      
      // First send the email using our Edge Function
      const { error: sendEmailError } = await supabase.functions.invoke('send-login-email', {
        body: { email, otp },
      });

      if (sendEmailError) throw sendEmailError;

      // Then set up the OTP in Supabase
      const { error: supabaseError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (supabaseError) throw supabaseError;

      toast({
        title: "Check your email",
        description: "We've sent you a login link with a one-time code.",
      });
      
      onSelectOTP();
    } catch (error: any) {
      console.error('Email verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification email",
      });
    }
  };

  const handleResetPassword = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Choose an Option</CardTitle>
        <CardDescription>
          Select how you would like to proceed with {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleOTPSelection}
          className="w-full"
          variant="default"
        >
          Sign in with One-Time Code
        </Button>
        <Button
          onClick={handleResetPassword}
          className="w-full"
          variant="outline"
        >
          Reset Password
        </Button>
      </CardContent>
    </Card>
  );
};