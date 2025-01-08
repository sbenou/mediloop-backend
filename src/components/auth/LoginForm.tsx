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
      // Sign out first to clear any existing session
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        
        if (error.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Please check your email and password and try again. If you recently reset your password, make sure you're using your new password.",
            duration: 6000,
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email Not Confirmed",
            description: "Please check your email and confirm your account before logging in. Don't forget to check your spam folder.",
          });
        } else if (error.status === 429 || error.message.includes('rate_limit')) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "You've made too many requests. Please wait a few minutes before trying again.",
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
        description: "An unexpected error occurred. Please try again.",
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