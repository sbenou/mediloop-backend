import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Check, X, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

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

const ResetPasswordButton = ({ isLoading, passwordsMatch }: { isLoading: boolean; passwordsMatch: boolean | null }) => (
  <Button type="submit" className="w-full" disabled={isLoading || !passwordsMatch}>
    {isLoading ? "Resetting Password..." : "Reset Password"}
  </Button>
);

export const ResetPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  useEffect(() => {
    console.log("Location state:", location.state);
    console.log("Full URL:", window.location.href);
    console.log("URL fragment (hash):", window.location.hash);
    console.log("Raw fragment value:", window.location.hash.substring(1));
    
    // Extract access token from URL fragment
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    
    console.log("Parsed URL parameters:", Object.fromEntries(params.entries()));
    
    if (accessToken) {
      console.log("Found access token in URL fragment");
      sessionStorage.setItem('reset_access_token', accessToken);
    } else {
      console.log("No access token found in URL fragment");
    }

    // Check if we're in a recovery flow
    const recoveryFlow = location.state?.recovery || params.get('type') === 'recovery';
    console.log("Recovery flow state:", recoveryFlow);
    
    if (!recoveryFlow && !accessToken) {
      console.log("No recovery flow or access token detected, redirecting to login");
      toast({
        variant: "destructive",
        title: "Invalid Access",
        description: "Please use the reset password link from your email.",
      });
      navigate('/login');
    }
  }, [location, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Starting password reset submission");
    
    if (password !== confirmPassword) {
      console.log("Password mismatch detected");
      return;
    }

    setIsLoading(true);
    console.log("Attempting to reset password...");

    try {
      const accessToken = sessionStorage.getItem('reset_access_token');
      console.log("Access token available:", !!accessToken);

      if (accessToken) {
        console.log("Setting session with access token");
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: accessToken
        });
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
      }

      console.log("Updating user password...");
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      console.log("Password reset successful");
      toast({
        title: "Success",
        description: "Your password has been reset successfully. Redirecting to login page...",
      });

      // Clean up stored token
      sessionStorage.removeItem('reset_access_token');

      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate("/login", { replace: true });

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
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

      <PasswordMatchAlert passwordsMatch={passwordsMatch} />
      
      <ResetPasswordButton isLoading={isLoading} passwordsMatch={passwordsMatch} />
    </form>
  );
};
