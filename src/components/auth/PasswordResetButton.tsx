import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "@/utils/auth";

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
        description: "A reset email was recently sent. Please wait before trying again.",
        duration: 5000,
      });
      return;
    }

    setIsSendingReset(true);
    
    try {
      const { error } = await sendPasswordResetEmail(email);

      if (error) {
        console.error("Password reset error:", error);
        
        if (error.message.includes('rate_limit') || error.message.includes('429')) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "Please wait a few seconds before requesting another password reset email.",
            duration: 5000,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Unable to send reset password email. Please try again later.",
            duration: 5000,
          });
        }
      } else {
        console.log("Password reset email sent successfully");
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
      setTimeout(() => {
        setIsSendingReset(false);
      }, 10000); // Wait 10 seconds before allowing another attempt
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