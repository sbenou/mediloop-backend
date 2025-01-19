import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, X, RotateCw } from "lucide-react";
import { useRecoilState } from 'recoil';
import { passwordResetState } from '@/store/auth/password-reset';
import { toast } from "@/hooks/use-toast";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [passwordReset, setPasswordReset] = useRecoilState(passwordResetState);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    const timer = setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      console.log("Initiating password reset for:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      toast({ 
        title: "Code Resent", 
        description: "A new verification code has been sent to your email address." 
      });
      
      startResendCooldown();
    } catch (error: any) {
      console.error("Failed to resend OTP:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resend the verification code.",
      });
    }
  };

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

  const verifyOtpWithRetry = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log("Attempting OTP verification:", { email, token: otp, type: "recovery" });
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'recovery'
        });

        if (error) throw error;
        console.log("OTP verification successful:", data);
        return data;
      } catch (error: any) {
        console.error(`OTP verification attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
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

    try {
      const data = await verifyOtpWithRetry();
      
      setPasswordReset(prev => ({
        ...prev,
        isSuccess: true,
        isLoading: false,
      }));

      toast({
        title: "Verification Successful",
        description: "You can now set your new password.",
      });
      
      navigate(`/reset-password/new?email=${encodeURIComponent(email)}`, { 
        replace: true 
      });

    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      setPasswordReset(prev => ({
        ...prev,
        isError: true,
        isLoading: false,
      }));

      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
      });

      setTimeout(() => {
        setPasswordReset(prev => ({
          ...prev,
          isError: false,
        }));
      }, 1000);
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
      
      <div className="space-y-2">
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
              <span>Verified</span>
            </div>
          ) : passwordReset.isError ? (
            <div className="flex items-center justify-center gap-2 w-full">
              <X className="h-4 w-4" />
              <span>Invalid Code</span>
            </div>
          ) : (
            "Verify Code"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || passwordReset.isLoading || passwordReset.isSuccess}
        >
          {resendCooldown > 0 ? (
            `Resend Code (${resendCooldown}s)`
          ) : (
            <div className="flex items-center justify-center gap-2">
              <RotateCw className="h-4 w-4" />
              <span>Resend Code</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};