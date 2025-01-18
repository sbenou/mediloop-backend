import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useRecoilState } from 'recoil';
import { passwordResetState } from '@/store/auth/password-reset';
import { toast } from "@/hooks/use-toast";
import { AuthResponse } from "@supabase/supabase-js";

const OTP_TIMEOUT = 20000; // 20 seconds
const OTP_LENGTH = 6;

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [passwordReset, setPasswordReset] = useRecoilState(passwordResetState);
  const navigate = useNavigate();

  const validateOTP = (otp: string): boolean => {
    if (!otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code.",
      });
      return false;
    }

    if (otp.length !== OTP_LENGTH) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `The verification code must be ${OTP_LENGTH} digits long.`,
      });
      return false;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "The verification code must contain only numbers.",
      });
      return false;
    }

    return true;
  };

  const handleVerificationError = (error: any) => {
    console.error('OTP verification error:', error);
    
    setPasswordReset(prev => ({
      ...prev,
      isError: true,
      isLoading: false,
    }));

    // Enhanced error messaging based on error type
    if (error.message?.includes('timeout')) {
      toast({
        variant: "destructive",
        title: "Verification Timeout",
        description: "The verification request timed out. Please try again.",
      });
    } else if (error?.status === 400) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The verification code is incorrect. Please try again.",
      });
    } else if (error?.status === 429) {
      toast({
        variant: "destructive",
        title: "Too Many Attempts",
        description: "Please wait a few minutes before trying again.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
      });
    }

    // Reset error state after delay
    setTimeout(() => {
      setPasswordReset(prev => ({
        ...prev,
        isError: false,
      }));
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting OTP verification process...");
    
    if (!validateOTP(otp)) {
      return;
    }

    setPasswordReset(prev => ({
      ...prev,
      isLoading: true,
      isError: false,
      isSuccess: false,
      email,
    }));

    // Create a timeout promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Verification request timed out")), OTP_TIMEOUT)
    );

    try {
      console.log("Verifying OTP for email:", email);
      
      // Race between the verification request and timeout
      const result = await Promise.race([
        supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'recovery'
        }),
        timeout
      ]) as AuthResponse;

      if (result.error) {
        console.error("OTP verification error:", result.error);
        throw result.error;
      }

      console.log("OTP verification successful, data:", result.data);
      
      setPasswordReset(prev => ({
        ...prev,
        isSuccess: true,
        isLoading: false,
      }));

      console.log("Preparing to navigate to new password page...");
      
      toast({
        title: "Verification Successful",
        description: "You can now set your new password.",
      });
      
      navigate(`/reset-password/new?email=${encodeURIComponent(email)}`, { 
        replace: true 
      });

    } catch (error: any) {
      handleVerificationError(error);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="space-y-2">
        <Label>Verification Code</Label>
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={setOtp}
          disabled={passwordReset.isLoading || passwordReset.isSuccess}
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      <Button 
        type="submit" 
        className={`w-full ${passwordReset.isSuccess ? 'bg-green-500 hover:bg-green-600' : ''} ${passwordReset.isError ? 'bg-red-500 hover:bg-red-600' : ''}`}
        disabled={passwordReset.isLoading || !otp || passwordReset.isSuccess || passwordReset.isError}
      >
        {passwordReset.isLoading ? (
          "Verifying..."
        ) : passwordReset.isSuccess ? (
          <div className="flex items-center justify-center gap-2 w-full">
            <Check className="h-4 w-4" />
            <span>OTP Verified</span>
          </div>
        ) : passwordReset.isError ? (
          <div className="flex items-center justify-center gap-2 w-full">
            <X className="h-4 w-4" />
            <span>Invalid OTP</span>
          </div>
        ) : (
          "Verify Code"
        )}
      </Button>
    </form>
  );
};