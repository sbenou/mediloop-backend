import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Check, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface NewPasswordFormProps {
  email: string;
}

export const NewPasswordForm = ({ email }: NewPasswordFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePasswords = () => {
    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
      });
      return false;
    }
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure both passwords match.",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting to update password for email:", email);
      const { data, error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      console.log("Password update successful for user:", data.user.id);
      
      // Show success toast with icon
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Password updated successfully. Please log in with your new password.</span>
          </div>
        ),
        duration: 3000,
      });

      // Sign out from all sessions
      try {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: 'global'
        });
        if (signOutError) throw signOutError;
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }

      // Delay navigation slightly to show the success message
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('Password update failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>{error.message || "Failed to update password. Please try again."}</span>
          </div>
        ),
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Key className="mr-2 h-4 w-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          <>
            <Key className="mr-2 h-4 w-4" />
            Update Password
          </>
        )}
      </Button>
    </form>
  );
};
