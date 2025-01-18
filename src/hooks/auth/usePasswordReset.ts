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

  const handlePasswordReset = async (email: string) => {
    if (isInCooldown || isSendingReset) return;

    setIsSendingReset(true);
    console.log("Initiating password reset for:", email);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create new users through password reset
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a verification code to reset your password.",
      });
      
      startCooldown();
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
      });
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