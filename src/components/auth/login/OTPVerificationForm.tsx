import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, X, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Supabase client check:", {
      initialized: !!supabase,
      gotAuth: !!supabase.auth,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", { event, session });
      
      if (event === 'SIGNED_IN' && session) {
        setIsSuccess(true);
        setIsSubmitting(false);

        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
        });
        
        navigate('/', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [email, navigate, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((current) => {
          if (current <= 1) {
            clearInterval(timer);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;

    try {
      console.log("Initiating OTP login for:", email);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      if (error) throw error;
      
      toast({ 
        title: "Code Resent", 
        description: "A new verification code has been sent to your email address." 
      });
      
      startResendCooldown();
    } catch (error: any) {
      console.error("Failed to resend OTP:", error);
      const description = error.name === 'TypeError' 
        ? "Please check your internet connection and try again."
        : error.message || "Failed to resend the verification code.";
      
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    }
  };

  const validateOTP = (otp: string): boolean => {
    console.log("Validating OTP:", { otp, length: otp.length });
    
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
    console.log("handleVerify triggered with OTP:", otp);
    console.log("Form submission state:", { 
      isSubmitting, 
      isSuccess,
      otpLength: otp.length 
    });
    
    if (isSubmitting || !validateOTP(otp)) {
      console.log("Validation failed or submission in progress");
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setIsSuccess(false);

    try {
      console.log("Starting OTP verification for login");
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      // The success case is handled by the onAuthStateChange listener
      
    } catch (error: any) {
      console.error("OTP verification error:", error);
      
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
      
      setIsError(true);
      setIsSubmitting(false);

      setTimeout(() => {
        setIsError(false);
      }, 1000);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="space-y-2">
        <Label>Verification Code</Label>
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={setOtp}
          disabled={isSubmitting || isSuccess}
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      <div className="space-y-2">
        <Button 
          type="submit" 
          className={`w-full ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''} ${isError ? 'bg-red-500 hover:bg-red-600' : ''}`}
          disabled={isSubmitting || !otp || isSuccess || isError}
        >
          {isSubmitting ? (
            "Verifying..."
          ) : isSuccess ? (
            <div className="flex items-center justify-center gap-2 w-full">
              <Check className="h-4 w-4" />
              <span>Verified</span>
            </div>
          ) : isError ? (
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
          disabled={resendCooldown > 0 || isSubmitting || isSuccess}
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