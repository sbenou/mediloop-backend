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
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX
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
      // First, sign in with password
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
        // We'll update the session cookie manually
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

      // IMPORTANT: Explicitly store session in all storage methods with multiple attempts
      const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      
      // Store the session multiple ways for maximum compatibility
      const sessionString = JSON.stringify(session);
      
      // First attempt: localStorage for persistence across tabs and page reloads
      try {
        window.localStorage.setItem(STORAGE_KEY, sessionString);
        console.log('Session explicitly stored in localStorage');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      // Second attempt: sessionStorage for redundancy
      try {
        window.sessionStorage.setItem(STORAGE_KEY, sessionString);
        console.log('Session explicitly stored in sessionStorage');
      } catch (storageError) {
        console.error('Error saving to sessionStorage:', storageError);
      }
      
      // Also, attempt to dispatch a custom event for listeners
      try {
        const event = new CustomEvent('supabase:auth:token:update', {
          detail: {
            timestamp: new Date().toISOString(),
            userId: session.user.id,
            expiresAt: session.expires_at
          }
        });
        window.dispatchEvent(event);
        console.log('Dispatched token update event');
      } catch (eventError) {
        console.error('Error dispatching token event:', eventError);
      }
      
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

      // Ensure pharmacy fields exist in profile
      const completeProfile = profile ? {
        ...profile,
        pharmacy_name: profile.pharmacy_name || null,
        pharmacy_logo_url: profile.pharmacy_logo_url || null
      } : null;

      // Update global auth state
      setAuth({
        user: session.user,
        profile: completeProfile,
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

      // Broadcast the login event to other tabs using localStorage event
      try {
        const loginEvent = {
          type: 'LOGIN',
          userId: session.user.id,
          timestamp: new Date().toISOString()
        };
        window.localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
        // Remove and set again to trigger storage events
        window.localStorage.removeItem('last_auth_event');
        window.localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
      } catch (eventError) {
        console.error('Error broadcasting login event:', eventError);
      }

      // Instead of calling onSuccess, directly redirect to dashboard
      // This avoids any potential race conditions
      navigate('/dashboard', { replace: true });
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
