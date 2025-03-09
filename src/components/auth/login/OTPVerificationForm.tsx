
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

// Define props interface
interface OTPVerificationFormProps {
  email: string;
  onSuccess: () => void;
}

const OTPVerificationForm: React.FC<OTPVerificationFormProps> = ({ email, onSuccess }) => {
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter the full verification code.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Verification successful",
        description: "You have successfully verified your email.",
      });

      // Call the onSuccess callback
      onSuccess();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Failed to verify the code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <InputOTP 
        maxLength={6}
        value={otp}
        onChange={setOTP}
        render={({ slots }) => (
          <InputOTPGroup>
            {slots.map((slot, index) => (
              <InputOTPSlot key={index} {...slot} />
            ))}
          </InputOTPGroup>
        )}
      />
      
      <Button 
        className="w-full" 
        onClick={handleVerify}
        disabled={isLoading || otp.length < 6}
      >
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center">
        Didn't receive a code? 
        <Button 
          variant="link" 
          className="px-2 py-0 h-auto"
          disabled={isLoading}
          onClick={async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  shouldCreateUser: false,
                }
              });
              if (error) throw error;
              toast({
                title: "Code resent",
                description: `A new verification code has been sent to ${email}`,
              });
            } catch (error: any) {
              toast({
                variant: "destructive",
                title: "Failed to resend code",
                description: error.message || "Something went wrong. Please try again.",
              });
            } finally {
              setIsLoading(false);
            }
          }}
        >
          Resend
        </Button>
      </p>
    </div>
  );
};

export default OTPVerificationForm;
