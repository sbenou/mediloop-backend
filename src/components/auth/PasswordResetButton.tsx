import { Button } from "@/components/ui/button";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from 'recoil';
import { passwordResetState } from '@/store/auth/password-reset';
import { toast } from "@/hooks/use-toast";

interface PasswordResetButtonProps {
  email: string;
  disabled?: boolean;
}

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const PasswordResetButton = ({ email, disabled }: PasswordResetButtonProps) => {
  const { isSendingReset, isInCooldown, remainingTime, handlePasswordReset } = usePasswordReset();
  const navigate = useNavigate();
  const setPasswordReset = useSetRecoilState(passwordResetState);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return false;
    }
    
    if (!EMAIL_REGEX.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return false;
    }
    
    return true;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    try {
      console.log("Initiating password reset for:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/new`,
      });

      if (error) throw error;

      setPasswordReset({
        isLoading: false,
        isSuccess: true,
        isError: false,
        email,
      });

      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
        duration: 5000,
      });

    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
        duration: 5000,
      });
    }
  };

  return (
    <Button
      type="button"
      variant="link"
      className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
      onClick={handleClick}
      disabled={disabled || isSendingReset || isInCooldown}
    >
      {isInCooldown 
        ? `Wait ${remainingTime}s...` 
        : isSendingReset 
          ? "Sending..." 
          : "Forgot your password?"}
    </Button>
  );
};