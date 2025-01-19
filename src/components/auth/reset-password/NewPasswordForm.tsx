import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Check, X, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

export const NewPasswordForm = ({ email }: { email: string }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== Password Reset Submission Start ===");
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting password update process...");

    try {
      console.log("Updating user password...");
      const { error: updateError } = await supabase.auth.updateUser({ 
        password 
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw updateError;
      }

      console.log("Password updated successfully");
      
      // Show success message
      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in with your new password.",
        duration: 5000,
      });

      console.log("Initiating sign out process...");
      
      try {
        console.log("Signing out from all sessions...");
        const { error: signOutError } = await supabase.auth.signOut({
          scope: 'global'
        });
        
        if (signOutError) {
          console.error('Sign out error:', signOutError);
          throw signOutError;
        }
        
        console.log("Sign out successful");
        
        // Navigate immediately after successful sign out
        navigate("/login", { replace: true });
        
      } catch (signOutError) {
        console.error('Sign out failed:', signOutError);
        // If sign out fails, still redirect to login
        navigate("/login", { replace: true });
      }

    } catch (error: any) {
      console.error('Password reset process failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
      });
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
        {isLoading ? "Updating Password..." : "Update Password"}
      </Button>
    </form>
  );
};