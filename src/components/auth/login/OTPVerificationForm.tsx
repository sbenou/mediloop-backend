
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
import { UserProfile } from "@/types/user";

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
    if (!email || otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Please enter a valid 6-digit verification code.",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Verifying OTP for:", email);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      if (data?.user) {
        console.log("OTP verification successful, fetching user profile");
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        // Ensure we have profile data with proper fallbacks
        const profile = profileData || {};
        
        // Create a complete profile with all required properties
        const completeProfile: UserProfile = {
          ...(profile as any),
          // Explicitly add the pharmacist fields with fallbacks
          pharmacist_stamp_url: profile.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile.pharmacist_signature_url || null
        };
          
        // Add the profile with all required properties to state
        setAuth({
          user: data.user,
          profile: completeProfile,
          isLoading: false,
          permissions: [],
        });

        toast({
          title: "Success",
          description: "Email verified successfully!",
        });

        // Clean up localStorage
        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');

        if (onSuccess) {
          onSuccess();
        }
        
        console.log("Redirecting to home page");
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      let description = "Failed to verify email. Please try again.";
      
      if (error.message?.includes('Invalid')) {
        description = "Invalid verification code. Please check and try again.";
      } else if (error.message?.includes('expired')) {
        description = "Verification code has expired. Please request a new one.";
      }
      
      toast({
        variant: "destructive",
        title: "Verification failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot 
                key={i} 
                index={i}
                className="w-10 h-10 text-center border-2"
              />
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
