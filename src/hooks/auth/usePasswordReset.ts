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

    // Check if we're in a cooldown period
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

    if (isSendingReset) {
      return;
    }

    setIsSendingReset(true);
    
    try {
      // Get the current domain and ensure we stay on the preview domain
      const currentDomain = window.location.origin;
      // Use the same domain for the redirect
      const redirectTo = `${currentDomain}/auth/callback?type=recovery`;
      
      console.log("Reset password redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Password reset error:", error);
        
        // Handle rate limit errors
        if (error.status === 429 || error.message?.includes('rate limit')) {
          const cooldownDuration = 60 * 1000; // 60 seconds cooldown
          const endTime = Date.now() + cooldownDuration;
          setCooldownEndTime(endTime);
          
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
        toast({
          title: "Check Your Email",
          description: "If an account exists with this email, you will receive password reset instructions.",
          duration: 5000,
        });
        
        // Set a cooldown period after successful attempt
        const cooldownDuration = 30 * 1000; // 30 seconds cooldown
        const endTime = Date.now() + cooldownDuration;
        setCooldownEndTime(endTime);
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