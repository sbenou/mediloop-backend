import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { authClientV2 } from "@/lib/authClientV2";

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
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsInCooldown(false);
          }
          return newTime;
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
      const response = await authClientV2.requestPasswordResetLink(email);

      toast({
        title: "Reset Password Request",
        description:
          response?.message ||
          "If an account exists with this email address, you'll receive a password reset link. Please check your inbox and spam folder.",
        duration: 3000,
      });
      
      startCooldown();
      return true;
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to send reset email",
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