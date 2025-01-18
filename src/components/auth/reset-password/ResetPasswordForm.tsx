import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Check, X, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
};

const PasswordInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  disabled,
  showPassword,
  onTogglePassword 
}: PasswordInputProps) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="pl-8"
        required
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
        disabled={disabled}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  </div>
);

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== Password Reset Submission Start ===");
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email address is missing. Please try the reset password process again.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    if (!otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code sent to your email.",
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting password reset process...");

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) throw error;

      // If OTP verification is successful, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      console.log("Password reset successful");
      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in with your new password.",
        duration: 5000,
      });

      navigate("/login", { replace: true });

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <PasswordInput
        id="password"
        label="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      {passwordsMatch !== null && (
        <Alert variant={passwordsMatch ? "default" : "destructive"} className="flex items-center gap-2">
          {passwordsMatch ? (
            <>
              <Check className="h-4 w-4" />
              <AlertDescription>Passwords match</AlertDescription>
            </>
          ) : (
            <>
              <X className="h-4 w-4" />
              <AlertDescription>Passwords do not match</AlertDescription>
            </>
          )}
        </Alert>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !passwordsMatch}
      >
        {isLoading ? "Resetting Password..." : "Reset Password"}
      </Button>
    </form>
  );
};
