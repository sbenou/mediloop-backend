import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, X, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecoilState } from 'recoil';
import { loginState } from '@/store/auth/login-state';
import { AuthService } from "@/services/auth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP Debug] ${message}`, data || '');
  }
};

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [login, setLogin] = useRecoilState(loginState);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Store email in localStorage for persistence across refreshes
    if (email) {
      localStorage.setItem('otp_email', email);
    }

    debug("Initializing OTP form with email:", email);
    debug("Supabase client check:", {
      initialized: !!supabase,
      gotAuth: !!supabase.auth,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debug("Auth state changed:", { event, session });
      
      if (event === 'SIGNED_IN' && session) {
        debug("User successfully signed in");
        setLogin(prev => ({
          ...prev,
          isSuccess: true,
          isLoading: false,
        }));

        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
        });
        
        // Add a small delay before navigation to ensure toast is visible
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      }
    });

    return () => {
      subscription.unsubscribe();
      localStorage.removeItem('otp_email'); // Cleanup on unmount
    };
  }, [email, navigate, toast, setLogin]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((current) => Math.max(0, current - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || login.isLoading) {
      debug("Resend blocked:", { resendCooldown, isLoading: login.isLoading });
      return;
    }

    try {
      await AuthService.requestOtp(email);
      
      toast({ 
        title: "Code Resent", 
        description: "A new verification code has been sent to your email address." 
      });
      
      setResendCooldown(RESEND_COOLDOWN);
    } catch (error: any) {
      debug("Failed to resend OTP:", error);
      let description = "Failed to resend verification code";
      
      if (error.name === 'TypeError') {
        description = "Please check your internet connection and try again.";
      } else if (error.message?.includes('rate limit')) {
        description = "Too many attempts. Please wait a moment before trying again.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    }
  };

  const validateOTP = (otp: string): boolean => {
    debug("Validating OTP:", { otp, length: otp.length });
    
    if (!otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code.",
      });
      return false;
    }

    if (otp.length !== OTP_LENGTH) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `The verification code must be ${OTP_LENGTH} digits long.`,
      });
      return false;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "The verification code must contain only numbers.",
      });
      return false;
    }

    return true;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    debug("Handling verification:", { otp, isLoading: login.isLoading });
    
    if (login.isLoading || !validateOTP(otp)) {
      debug("Validation failed or submission in progress");
      return;
    }

    setLogin(prev => ({
      ...prev,
      isLoading: true,
      isError: false,
      isSuccess: false,
    }));

    try {
      debug("Starting OTP verification");
      await AuthService.verifyOtp(email, otp);
      debug("OTP verification successful");
      // Success case handled by onAuthStateChange listener
      
    } catch (error: any) {
      debug("OTP verification error:", error);
      
      let description = "Invalid verification code. Please try again.";
      if (error.name === 'TypeError') {
        description = "Please check your internet connection and try again.";
      } else if (error.message?.includes('expired')) {
        description = "The verification code has expired. Please request a new one.";
      } else if (error.message?.includes('invalid')) {
        description = "Invalid verification code. Please check and try again.";
      }

      toast({
        variant: "destructive",
        title: "Verification Failed",
        description,
      });
      
      setLogin(prev => ({
        ...prev,
        isError: true,
        isLoading: false,
      }));

      setTimeout(() => {
        setLogin(prev => ({
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
        <div role="alert" aria-live="polite">
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={setOtp}
            disabled={login.isLoading || login.isSuccess}
            aria-label="Enter verification code"
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>
      
      <div className="space-y-2">
        <Button 
          type="submit" 
          className={`w-full ${login.isSuccess ? 'bg-green-500 hover:bg-green-600' : ''} ${login.isError ? 'bg-red-500 hover:bg-red-600' : ''}`}
          disabled={login.isLoading || !otp || login.isSuccess || login.isError}
          aria-live="polite"
        >
          {login.isLoading ? (
            "Verifying..."
          ) : login.isSuccess ? (
            <div className="flex items-center justify-center gap-2 w-full">
              <Check className="h-4 w-4" />
              <span>Verified</span>
            </div>
          ) : login.isError ? (
            <div className="flex items-center justify-center gap-2 w-full">
              <X className="h-4 w-4" />
              <span>Invalid Code</span>
            </div>
          ) : (
            "Verify Code"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={handleResendOtp}
          disabled={resendCooldown > 0 || login.isLoading || login.isSuccess}
          aria-live="polite"
        >
          {resendCooldown > 0 ? (
            `Resend Code (${resendCooldown}s)`
          ) : (
            <div className="flex items-center justify-center gap-2">
              <RotateCw className="h-4 w-4" />
              <span>Resend Code</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};