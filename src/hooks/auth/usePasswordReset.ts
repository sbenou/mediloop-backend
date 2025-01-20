import { useState, useEffect } from 'react';

const COOLDOWN_DURATION = 60; // 60 seconds cooldown

export const usePasswordReset = () => {
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

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

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isInCooldown, remainingTime]);

  const handlePasswordReset = () => {
    setIsSendingReset(true);
    
    // Start cooldown
    setIsInCooldown(true);
    setRemainingTime(COOLDOWN_DURATION);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsSendingReset(false);
        resolve(true);
      }, 1000);
    });
  };

  return {
    isSendingReset,
    isInCooldown,
    remainingTime,
    handlePasswordReset,
  };
};