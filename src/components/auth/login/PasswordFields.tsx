
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { useSetRecoilState } from 'recoil';
import { authState } from '@/store/auth/atoms';
import { useNavigate } from 'react-router-dom';

interface PasswordFieldsProps {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFields = ({ email, onSuccess, onForgotPassword }: PasswordFieldsProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data received');
      }

      console.log('Login successful, fetching profile');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      console.log('Setting auth state');
      setAuth({
        user: data.user,
        profile: profile || null,
        isLoading: false,
        permissions: [],
      });

      toast({
        title: "Success",
        description: "Successfully logged in!",
      });

      console.log('Navigating to home page');
      navigate('/', { replace: true });
      onSuccess();
    } catch (error: any) {
      console.error('Login process error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to log in",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(e);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 text-left">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Log in"}
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
