import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthService } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationFormProps {
  email: string;
}

export const OTPVerificationForm = ({ email }: OTPVerificationFormProps) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await AuthService.verifyOtp(email, otp);
      
      // Clear the stored email after successful verification
      localStorage.removeItem('otp_email');
      localStorage.removeItem('otp_email_expiry');
      
      toast({
        title: "Success",
        description: "Your email has been verified.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('OTP Verification Failed:', error);
      
      let description = "Invalid verification code";
      if (error.message?.includes('expired')) {
        description = "Verification code has expired. Please request a new one.";
      }
      
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter verification code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify Email"}
      </Button>
    </form>
  );
};