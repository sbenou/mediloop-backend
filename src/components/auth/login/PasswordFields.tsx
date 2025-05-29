
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

interface PasswordFieldsProps {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFields = ({ email, onSuccess, onForgotPassword }: PasswordFieldsProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password required",
        description: "Please enter your password.",
      });
      return;
    }

    setIsLoading(true);
    console.log('[PasswordFields] Attempting login for:', email);

    try {
      const { user, session, error } = await authService.signIn(email, password);

      if (error) {
        console.error('[PasswordFields] Login error:', error);
        let errorMessage = "Invalid email or password. Please try again.";
        
        if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please check your email and confirm your account before logging in.";
        } else if (error.message.includes('rate_limit') || error.message.includes('too_many_requests')) {
          errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
        }

        toast({
          variant: "destructive",
          title: "Login failed",
          description: errorMessage,
        });
        return;
      }

      if (!user || !session) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Unable to complete login. Please try again.",
        });
        return;
      }

      console.log('[PasswordFields] Login successful for user:', user.id);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      // Get user role from metadata
      const userRole = user.user_metadata?.role || 'patient';
      
      // Navigate to appropriate dashboard
      const dashboardRoute = getDashboardRouteByRole(userRole);
      console.log('[PasswordFields] Redirecting to:', dashboardRoute);
      
      navigate(dashboardRoute, { replace: true });
      onSuccess();

    } catch (error) {
      console.error('[PasswordFields] Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="pl-8 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
        />
        <Label htmlFor="remember" className="text-sm">
          Remember me
        </Label>
      </div>

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
        
        <Button
          type="button"
          variant="link"
          className="w-full text-sm"
          onClick={onForgotPassword}
        >
          Forgot your password?
        </Button>
      </div>
    </form>
  );
};
