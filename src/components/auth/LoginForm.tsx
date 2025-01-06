import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PasswordResetButton } from "./PasswordResetButton";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        
        // Parse the error message from the JSON string if it exists
        let errorBody;
        try {
          errorBody = error.message && JSON.parse(error.message);
        } catch {
          errorBody = null;
        }
        
        if (error.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email Not Confirmed",
            description: "Please check your email and confirm your account before logging in. Don't forget to check your spam folder.",
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Invalid Credentials",
            description: "The email or password you entered is incorrect. Please try again.",
          });
        } else if (
          error.status === 429 || 
          error.message.includes('rate_limit') ||
          errorBody?.code === 'over_email_send_rate_limit' ||
          (error.message.includes('email') && error.message.includes('exceeded'))
        ) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "You've made too many requests. Please wait a few minutes before trying to log in or reset your password again.",
            duration: 8000,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error("Unexpected error during login:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            placeholder="Enter your email"
            type="email"
            className="pl-8"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="pl-8"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <PasswordResetButton email={email} disabled={isLoading} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        <LogIn className="mr-2 h-4 w-4" />
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};