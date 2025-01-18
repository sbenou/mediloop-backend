import { Button } from "@/components/ui/button";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";
import { useNavigate } from "react-router-dom";

interface PasswordResetButtonProps {
  email: string;
  disabled?: boolean;
}

export const PasswordResetButton = ({ email, disabled }: PasswordResetButtonProps) => {
  const { isSendingReset, isInCooldown, remainingTime, handlePasswordReset } = usePasswordReset();
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const success = await handlePasswordReset(email);
    if (success) {
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