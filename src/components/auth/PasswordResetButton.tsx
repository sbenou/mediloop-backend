import { Button } from "@/components/ui/button";
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";

interface PasswordResetButtonProps {
  email: string;
  disabled?: boolean;
}

export const PasswordResetButton = ({ email, disabled }: PasswordResetButtonProps) => {
  const { isSendingReset, isInCooldown, remainingTime, handlePasswordReset } = usePasswordReset();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handlePasswordReset(email);
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