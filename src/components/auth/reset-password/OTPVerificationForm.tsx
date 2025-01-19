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
import { useToast } from "@/hooks/use-toast";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export const OTPVerificationForm = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState("");
  const [passwordReset, setPasswordReset] = useRecoilState(passwordResetState);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordChoice, setShowPasswordChoice] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("=== OTP Verification Component Mounted ===");
    console.log("Supabase client check:", {
      initialized: !!supabase,
      gotAuth: !!supabase.auth,
    });
    console.log("Initial email state:", email);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", { event, session: session?.user?.id });
      
      if (event === 'SIGNED_IN') {
        console.log("User signed in successfully");
        setPasswordReset(prev => ({
          ...prev,
          isSuccess: true,
          isLoading: false,
        }));

        toast({
          title: "Verification Successful",
          description: "Your email has been verified.",
        });
        
        setShowPasswordChoice(true);
      }
    });

    return () => {
      console.log("=== OTP Verification Component Unmounting ===");
      subscription.unsubscribe();
    };
  }, [email, setPasswordReset, toast]);

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
      console.log("=== Starting OTP Resend Process ===");
      console.log("Email:", email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });
      
      if (error) throw error;
      
      console.log("OTP resend successful");
      toast({ 
        title: "Code Resent", 
        description: "A new verification code has been sent to your email." 
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
    console.log("=== Starting OTP Verification Process ===");
    console.log("OTP:", otp);
    
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
      console.log("Verifying OTP with Supabase");
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      console.log("OTP verification successful");
      // Success is handled by the onAuthStateChange listener
      
    } catch (error: any) {
      console.error("=== OTP Verification Failed ===");
      console.error("Error details:", error);
      
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

      // Reset error state after a delay
      setTimeout(() => {
        setPasswordReset(prev => ({
          ...prev,
          isError: false,
        }));
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithOTP = async () => {
    try {
      console.log("Updating auth method to OTP");
      const { error: updateError } = await supabase.rpc('update_auth_method', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        method: 'otp'
      });

      if (updateError) throw updateError;

      console.log("Auth method updated successfully");
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