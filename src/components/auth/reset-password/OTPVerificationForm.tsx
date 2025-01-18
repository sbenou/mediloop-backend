import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting OTP verification process...");
    
    if (!otp) {
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
      
      setIsSuccess(true);
      
      // Add a small delay before navigation
      setTimeout(() => {
        navigate(`/reset-password/new?email=${encodeURIComponent(email)}`, { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('OTP verification error:', error);
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
        className={`w-full ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''}`}
        disabled={isLoading || !otp || isSuccess}
      >
        {isLoading ? (
          "Verifying..."
        ) : isSuccess ? (
          <>
            <Check className="h-4 w-4" />
            OTP Verified
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
    </form>
  );
};