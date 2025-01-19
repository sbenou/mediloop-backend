import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface OTPVerificationFormProps {
  email: string;
  onSuccess: () => void;
}

export const OTPVerificationForm = ({ email, onSuccess }: OTPVerificationFormProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully logged in!",
      });

      onSuccess();
    } catch (error: any) {
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
    <div className="space-y-4">
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
        onClick={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Verify Code"}
      </Button>
    </div>
  );
};