import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';

interface OTPVerificationFormProps {
  email: string;
  onSuccess?: () => void;
}

export const OTPVerificationForm = ({ email, onSuccess }: OTPVerificationFormProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);

  const handleVerification = async () => {
    if (!email || !otp) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Please enter the verification code.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setAuth({
          user: data.user,
          profile,
          isLoading: false,
          permissions: [],
        });

        toast({
          title: "Success",
          description: "Email verified successfully!",
        });

        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');

        if (onSuccess) {
          onSuccess();
        }
        navigate('/');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Failed to verify email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        className="w-full"
        onClick={handleVerification}
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>
    </div>
  );
};