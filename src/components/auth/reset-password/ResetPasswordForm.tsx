import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PasswordInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  disabled 
}: { 
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        id={id}
        type="password"
        placeholder={`Enter ${label.toLowerCase()}`}
        className="pl-8"
        required
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  </div>
);

const PasswordMatchAlert = ({ passwordsMatch }: { passwordsMatch: boolean | null }) => {
  if (passwordsMatch === null) return null;

  return (
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
  );
};

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }

    setIsLoading(true);

    try {
      // Get the recovery data from sessionStorage
      const recoveryDataStr = sessionStorage.getItem('recovery_data');
      if (!recoveryDataStr) {
        throw new Error('Recovery session not found');
      }

      const recoveryData = JSON.parse(recoveryDataStr);
      const { code } = recoveryData;

      // Update the user's password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      // Clear the recovery data
      sessionStorage.removeItem('recovery_data');

      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in with your new password.",
      });

      // Sign out the user to ensure a clean state
      await supabase.auth.signOut();
      
      // Use setTimeout to ensure the toast is visible before navigation
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
      });
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        id="password"
        label="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
      />

      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
      />

      <PasswordMatchAlert passwordsMatch={passwordsMatch} />

      <Button type="submit" className="w-full" disabled={isLoading || !passwordsMatch}>
        {isLoading ? "Resetting Password..." : "Reset Password"}
      </Button>
    </form>
  );
};