import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const COOLDOWN_DURATION = 60; // seconds

export const usePasswordReset = () => {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const { toast } = useToast();

  const startCooldown = () => {
    setIsInCooldown(true);
    setRemainingTime(COOLDOWN_DURATION);
    
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsInCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePasswordReset = async (email: string): Promise<boolean> => {
    if (isInCooldown || isSendingReset) return false;

    setIsSendingReset(true);
    console.log("Initiating password reset for:", email);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      toast({
        title: "Reset Password Request",
        description: "If an account exists with this email address, we've sent you a verification code. Please check your inbox and spam folder.",
        duration: 3000, // Reduced from 5000 to 3000ms
      });
      
      startCooldown();
      return true;
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
        duration: 3000, // Consistent duration
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