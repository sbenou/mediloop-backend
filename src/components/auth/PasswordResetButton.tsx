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

    const success = await handlePasswordReset(email);
    if (success) {
      setPasswordReset({
        isLoading: false,
        isSuccess: false,
        isError: false,
        email,
      });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
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