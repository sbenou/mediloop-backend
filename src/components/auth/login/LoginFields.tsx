import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PasswordResetButton } from "../PasswordResetButton";

interface LoginFieldsProps {
  email: string;
  onEmailChange: (value: string) => void;
  isLoading: boolean;
  onEmailSent: () => void;
}

export const LoginFields = ({
  email,
  onEmailChange,
  isLoading,
  onEmailSent,
}: LoginFieldsProps) => {
  const { toast } = useToast();

  const handleOtpLogin = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to receive the login code.",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      // Update auth method
      const { error: updateError } = await supabase.rpc('update_auth_method', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        method: 'otp'
      });

      if (updateError) console.error('Error updating auth method:', updateError);

      toast({
        title: "Code Sent",
        description: "Check your email for the login code.",
      });
      
      onEmailSent(); // Show the OTP form after email is sent
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send login code",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <div className="flex flex-col space-y-4">
        <Button
          type="button"
          className="w-full"
          onClick={handleOtpLogin}
          disabled={isLoading}
        >
          {isLoading ? "Sending code..." : "Continue with Email"}
        </Button>
        <div className="text-center">
          <PasswordResetButton email={email} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};