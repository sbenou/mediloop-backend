import { Button } from "@/components/ui/button";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from 'recoil';
import { passwordResetState } from '@/store/auth/password-reset';

interface PasswordResetButtonProps {
  email: string;
  disabled?: boolean;
}

export const PasswordResetButton = ({ email, disabled }: PasswordResetButtonProps) => {
  const { isSendingReset, isInCooldown, remainingTime, handlePasswordReset } = usePasswordReset();
  const navigate = useNavigate();
  const setPasswordReset = useSetRecoilState(passwordResetState);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const success = await handlePasswordReset(email);
    if (success) {
      setPasswordReset({
        isLoading: false,
        isSuccess: false,
        isError: false,
        email,
      });
      // Immediately redirect to reset password page with email in URL
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