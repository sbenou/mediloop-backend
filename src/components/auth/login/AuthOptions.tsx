import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface AuthOptionsProps {
  email: string;
  onBack: () => void;
}

export const AuthOptions = ({ email, onBack }: AuthOptionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOTPSelection = async () => {
    try {
      console.log('=== Starting OTP Process ===');
      console.log('Email:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      console.log('Supabase OTP setup response:', data);

      if (signInError) {
        console.error('Supabase error:', signInError);
        throw signInError;
      }

      console.log('OTP process completed successfully');
      
      toast({
        title: "Check your email",
        description: "We've sent you a verification code.",
      });
      
      navigate(`/reset-password/verify?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (error: any) {
      console.error('=== OTP Process Failed ===');
      console.error('Error details:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification code",
      });
    }
  };

  const handleEmailLinkReset = async () => {
    try {
      console.log("Initiating password reset for:", email);
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
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
      });
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
        >
          Reset with One-Time Code
        </Button>
        <Button
          onClick={handleEmailLinkReset}
          className="w-full"
          variant="outline"
        >
          Reset with Email Link
        </Button>
      </CardContent>
    </Card>
  );
};