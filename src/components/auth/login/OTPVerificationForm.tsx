import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSetRecoilState } from 'recoil';
import { loginState } from '@/store/auth/login-state';

interface OTPVerificationFormProps {
  email: string;
}

export const OTPVerificationForm = ({ email }: OTPVerificationFormProps) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const setLogin = useSetRecoilState(loginState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Verifying OTP for email:", email);
    
    if (!token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code.",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting to verify OTP...");
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink'
      });

      if (error) throw error;

      console.log("OTP verification successful:", data);
      
      // Check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        throw new Error('No session after successful verification');
      }

      setLogin({
        isLoading: false,
        isError: false,
        isSuccess: true,
        email: null
      });

      toast({
        title: "Success",
        description: "Successfully logged in.",
      });

      // Redirect to home page
      navigate('/', { replace: true });

    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Invalid verification code.",
      });
      setLogin({
        isLoading: false,
        isError: true,
        isSuccess: false,
        email
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
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify Code"}
      </Button>
    </form>
  );
};