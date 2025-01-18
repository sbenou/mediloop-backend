import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting OTP verification process...");
    
    if (!otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code sent to your email.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) throw error;

      console.log("OTP verification successful", data);
      
      navigate(`/reset-password/new?email=${encodeURIComponent(email)}`);
      
      toast({
        title: "Success",
        description: "Email verified successfully. You can now reset your password.",
      });

    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Invalid verification code. Please try again.",
      });
    } finally {
      setIsLoading(false);
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
        className="w-full" 
        disabled={isLoading || !otp}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </Button>
    </form>
  );
};