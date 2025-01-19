import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_COOLDOWN = 60; // fallback value in seconds

export const usePasswordReset = () => {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInCooldown && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsInCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isInCooldown, remainingTime]);

  const startCooldown = (duration: number = DEFAULT_COOLDOWN) => {
    setIsInCooldown(true);
    setRemainingTime(duration);
  };

  const handlePasswordReset = async (email: string): Promise<boolean> => {
    if (isInCooldown || isSendingReset) return false;

    setIsSendingReset(true);
    console.log("Initiating password reset for:", email);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/new`,
      });

      if (error) throw error;

      toast({
        title: "Reset Password Request",
        description: "If an account exists with this email address, you'll receive a password reset link. Please check your inbox and spam folder.",
        duration: 3000,
      });
      
      startCooldown();
      return true;
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
        duration: 3000,
      });
      return false;
    } finally {
      setIsSendingReset(false);
    }
  };

  return {
    handlePasswordReset,
    isSendingReset,
    isInCooldown,
    remainingTime,
  };
};