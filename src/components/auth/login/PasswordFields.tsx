import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader } from "lucide-react";
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from "@/components/ui/checkbox";

interface PasswordFieldsProps {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFields = ({ email, onSuccess, onForgotPassword }: PasswordFieldsProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('Starting login process...', { email, rememberMe });

    try {
      // First, sign in with password - using session properties instead of expiresIn
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }

      if (!signInData.user) {
        console.error('No user data received');
        throw new Error('No user data received');
      }

      console.log('Sign in successful:', signInData.user.id);

      // If rememberMe is checked, update the session
      if (rememberMe && signInData.session) {
        console.log('Setting extended session duration due to Remember Me');
        // We'll update the session cookie manually in the auth service
        const { error: sessionError } = await supabase.auth.updateUser({
          data: { rememberMe: true }
        });
        
        if (sessionError) {
          console.error('Failed to update session preferences:', sessionError);
        }
      }

      // Get the session to confirm authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('No session after successful sign in');
        throw new Error('Authentication failed - no session');
      }

      console.log('Session confirmed:', session.user.id);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      // Update global auth state
      setAuth({
        user: session.user,
        profile,
        permissions: [],
        isLoading: false,
      });

      console.log('Auth state updated successfully');
      console.log('User role:', profile.role);

      // Show success message
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Redirect based on user role
      if (profile.role === 'superadmin') {
        console.log('Redirecting to superadmin dashboard...');
        navigate('/superadmin-dashboard', { replace: true });
        return; // Add early return to prevent onSuccess from being called
      } else if (profile.role === 'pharmacist') {
        console.log('Redirecting to pharmacy dashboard...');
        navigate('/pharmacy/dashboard', { replace: true });
        return; // Add early return to prevent onSuccess from being called
      } else {
        console.log('Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
        return; // Add early return to prevent onSuccess from being called
      }
      
      // This line should never be reached due to the early returns above
      // We'll keep it as a fallback just in case
      onSuccess();

    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Reset auth state
      setAuth({
        user: null,
        profile: null,
        permissions: [],
        isLoading: false,
      });

      // Show error message
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 text-start">
      <div className="space-y-2 text-start">
        <Label htmlFor="password" className="text-start block">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="rememberMe" 
          checked={rememberMe} 
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Remember me
        </Label>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
      <Button
        type="button"
        variant="link"
        className="w-full"
        onClick={onForgotPassword}
        disabled={isLoading}
      >
        Forgot your password?
      </Button>
    </form>
  );
};
