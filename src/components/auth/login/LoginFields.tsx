import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordResetButton } from "../PasswordResetButton";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface LoginFieldsProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  isLoading: boolean;
}

export const LoginFields = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  isLoading,
}: LoginFieldsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const { toast } = useToast();

  const handleOtpLogin = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to receive the login code.",
      });
      return;
    }

    setIsOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      // Update auth method
      const { error: updateError } = await supabase.rpc('update_auth_method', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        method: 'otp'
      });

      if (updateError) console.error('Error updating auth method:', updateError);

      toast({
        title: "Code Sent",
        description: "Check your email for the login code.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send login code",
      });
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading || isOtpLoading}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading || isOtpLoading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            disabled={isLoading || isOtpLoading}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <PasswordResetButton email={email} disabled={isLoading || isOtpLoading} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOtpLogin}
            disabled={isLoading || isOtpLoading}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {isOtpLoading ? "Sending code..." : "Login with code"}
          </Button>
        </div>
      </div>
    </div>
  );
};