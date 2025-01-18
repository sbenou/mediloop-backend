import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useRecoilState } from 'recoil';
import { passwordResetState } from '@/store/auth/password-reset';

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [passwordReset, setPasswordReset] = useRecoilState(passwordResetState);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting OTP verification process...");
    
    if (!otp) {
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
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) throw error;

      console.log("OTP verification successful", data);
      
      setPasswordReset(prev => ({
        ...prev,
        isSuccess: true,
        isLoading: false,
      }));
      
      // Navigate after a brief delay to show success state
      setTimeout(() => {
        navigate(`/reset-password/new?email=${encodeURIComponent(email)}`, { replace: true });
      }, 1000);

    } catch (error: any) {
      console.error('OTP verification error:', error);
      setPasswordReset(prev => ({
        ...prev,
        isError: true,
        isLoading: false,
      }));
      
      // Reset error state after delay
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
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={passwordReset.isLoading || passwordReset.isSuccess}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
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