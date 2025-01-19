import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Check, X, RotateCw } from "lucide-react";
import { useRecoilState } from 'recoil';
import { passwordResetState } from '@/store/auth/password-reset';
import { toast } from "@/hooks/use-toast";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [passwordReset, setPasswordReset] = useRecoilState(passwordResetState);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordChoice, setShowPasswordChoice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Supabase client check:", {
      initialized: !!supabase,
      gotAuth: !!supabase.auth,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", { event, session: session?.user?.id });
      
      if (event === 'SIGNED_IN') {
        setPasswordReset(prev => ({
          ...prev,
          isSuccess: true,
          isLoading: false,
        }));

        toast({
          title: "Login Successful",
          description: "You are now logged in.",
        });
        
        setShowPasswordChoice(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [email, navigate, setPasswordReset]);

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
    
    if (isSubmitting || !validateOTP(otp)) {
      return;
    }

    setIsSubmitting(true);
    setPasswordReset(prev => ({
      ...prev,
      isLoading: true,
      isError: false,
      isSuccess: false,
      email,
    }));

    try {
      console.log("Starting OTP verification");
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'  // Changed from 'magiclink' to 'email'
      });

      if (error) throw error;

      // Success is handled by the onAuthStateChange listener
      
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
      
      setPasswordReset(prev => ({
        ...prev,
        isError: true,
        isLoading: false,
      }));

      setTimeout(() => {
        setPasswordReset(prev => ({
          ...prev,
          isError: false,
        }));
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithOTP = async () => {
    // Update auth method to OTP
    try {
      const { error: updateError } = await supabase.rpc('update_auth_method', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        method: 'otp'
      });

      if (updateError) throw updateError;

      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error updating auth method:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update authentication method. Please try again.",
      });
    }
  };

  const handleSetPassword = () => {
    navigate(`/reset-password/new?email=${encodeURIComponent(email)}`, { 
      replace: true 
    });
  };

  return (
    <>
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label>Verification Code</Label>
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={setOtp}
            disabled={passwordReset.isLoading || passwordReset.isSuccess}
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
            className={`w-full ${passwordReset.isSuccess ? 'bg-green-500 hover:bg-green-600' : ''} ${passwordReset.isError ? 'bg-red-500 hover:bg-red-600' : ''}`}
            disabled={passwordReset.isLoading || !otp || passwordReset.isSuccess || passwordReset.isError}
          >
            {passwordReset.isLoading ? (
              "Verifying..."
            ) : passwordReset.isSuccess ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <Check className="h-4 w-4" />
                <span>Verified</span>
              </div>
            ) : passwordReset.isError ? (
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
            disabled={resendCooldown > 0 || passwordReset.isLoading || passwordReset.isSuccess}
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

      <Dialog open={showPasswordChoice} onOpenChange={setShowPasswordChoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Login Method</DialogTitle>
            <DialogDescription>
              You can continue using one-time codes to log in, or set up a password for future logins.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button onClick={handleContinueWithOTP}>
              Continue with One-Time Codes
            </Button>
            <Button variant="outline" onClick={handleSetPassword}>
              Set Up Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};