import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "@/utils/auth";
import { AuthError } from "@supabase/supabase-js";

interface PasswordResetButtonProps {
  email: string;
  disabled?: boolean;
}

export const PasswordResetButton = ({ email, disabled }: PasswordResetButtonProps) => {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }

    if (isSendingReset) {
      toast({
        variant: "destructive",
        title: "Please Wait",
        description: "Please wait a few seconds before requesting another reset email.",
        duration: 5000,
      });
      return;
    }

    setIsSendingReset(true);
    
    try {
      const { error } = await sendPasswordResetEmail(email);

      if (error) {
        console.error("Password reset error:", error);
        
        // Check for rate limit errors
        if (error.status === 429) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "You've made too many requests. Please wait a few minutes before trying to reset your password again.",
            duration: 8000,
          });
          return;
        }

        // Try to parse the error message for additional context
        let errorMessage = error.message;
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        } catch {
          // If parsing fails, use the original error message
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage || "Unable to send reset password email. Please try again later.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Check Your Email",
          description: "If an account exists with this email, you will receive password reset instructions.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error sending reset password email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to process your request at this time. Please try again later.",
        duration: 5000,
      });
    } finally {
      // Set a cooldown period before allowing another attempt
      setTimeout(() => {
        setIsSendingReset(false);
      }, 10000);
    }
  };

  return (
    <Button
      type="button"
      variant="link"
      className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
      onClick={handleForgotPassword}
      disabled={disabled || isSendingReset}
    >
      {isSendingReset ? "Please wait..." : "Forgot your password?"}
    </Button>
  );
};