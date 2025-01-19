import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface OTPVerificationFormProps {
  email: string;
}

export const OTPVerificationForm = ({ email }: OTPVerificationFormProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Verifying OTP for login:', { email, otp });
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      console.log('OTP verification successful');
      
      toast({
        title: "Success",
        description: "Successfully logged in!",
      });

      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to verify code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp">Enter verification code</Label>
        <Input
          id="otp"
          type="text"
          placeholder="Enter the code sent to your email"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </Button>
    </form>
  );
};