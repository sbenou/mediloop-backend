import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const usePasswordReset = () => {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const { toast } = useToast();

  const handlePasswordReset = async (email: string) => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }

    if (cooldownEndTime && Date.now() < cooldownEndTime) {
      const remainingSeconds = Math.ceil((cooldownEndTime - Date.now()) / 1000);
      toast({
        variant: "destructive",
        title: "Please Wait",
        description: `Please wait ${remainingSeconds} seconds before requesting another reset email.`,
        duration: 5000,
      });
      return;
    }

    if (isSendingReset) return;

    setIsSendingReset(true);
    
    try {
      console.log("Sending password reset email...");
      const currentDomain = window.location.origin;
      const redirectTo = `${currentDomain}/reset-password`;
      console.log("Reset password redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Password reset error:", error);
        
        if (error.status === 429 || error.message?.includes('rate limit')) {
          const cooldownDuration = 60 * 1000; // 60 seconds
          setCooldownEndTime(Date.now() + cooldownDuration);
          
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "You've made too many requests. Please wait 60 seconds before trying to reset your password again.",
            duration: 8000,
          });
          return;
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Unable to send reset password email. Please try again later.",
          duration: 5000,
        });
      } else {
        console.log("Reset email sent successfully");
        
        toast({
          title: "Check Your Email",
          description: "If an account exists with this email, you will receive password reset instructions.",
          duration: 5000,
        });
        
        const cooldownDuration = 60 * 1000; // 60 seconds
        setCooldownEndTime(Date.now() + cooldownDuration);
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
      setIsSendingReset(false);
    }
  };

  const isInCooldown = cooldownEndTime && Date.now() < cooldownEndTime;
  const remainingTime = isInCooldown ? Math.ceil((cooldownEndTime - Date.now()) / 1000) : 0;

  return {
    isSendingReset,
    isInCooldown,
    remainingTime,
    handlePasswordReset
  };
};