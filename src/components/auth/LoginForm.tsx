
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordFields } from "./login/PasswordFields";
import { AuthOptions } from "./login/AuthOptions";
import { supabase } from "@/lib/supabase";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Continue clicked with email:', email);

    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }

    // Show password fields
    setShowPassword(true);
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    navigate("/reset-password", { state: { email } });
  };

  const handleLoginSuccess = async () => {
    console.log('Login success, checking session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error after login:', error);
      return;
    }

    if (session?.user) {
      console.log('Valid session found, proceeding with success callback');
      onSuccess();
    } else {
      console.error('No session found after successful login');
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Failed to establish session. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleContinue} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {!showPassword && (
          <>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
            >
              Continue with Email
            </button>
            <AuthOptions />
          </>
        )}
      </form>

      {showPassword && (
        <PasswordFields
          email={email}
          onSuccess={handleLoginSuccess}
          onForgotPassword={handleForgotPassword}
        />
      )}
    </div>
  );
};
