import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { toast } = useToast();

  // Get the complete base URL including the project path and reset-password route
  const getBaseUrl = () => {
    // Get the current URL
    const url = window.location.href;
    // Find the base lovable.dev URL from the Supabase redirect URLs
    if (url.includes('lovableproject.com')) {
      const projectId = url.split('.lovableproject.com')[0].split('//')[1];
      return `https://lovable.dev/projects/${projectId}/reset-password`;
    }
    // For lovable.dev URLs, use the current project path
    const projectsIndex = url.indexOf('/projects/');
    if (projectsIndex !== -1) {
      const baseUrl = url.substring(0, url.indexOf('/', projectsIndex + 10));
      return `${baseUrl}/reset-password`;
    }
    return `${window.location.origin}/reset-password`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }

    if (isSendingReset) {
      toast({
        variant: "destructive",
        title: "Please Wait",
        description: "A reset email was recently sent. Please wait before trying again.",
        duration: 5000,
      });
      return;
    }

    setIsSendingReset(true);
    
    try {
      console.log("Sending password reset email...");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getBaseUrl(),
      });

      if (error) {
        console.error("Password reset error:", error);
        
        if (error.message.includes('rate_limit') || error.message.includes('429')) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "Please wait a few minutes before requesting another password reset email.",
            duration: 5000,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Unable to send reset password email. Please try again later.",
            duration: 5000,
          });
        }
      } else {
        console.log("Password reset email sent successfully");
        toast({
          title: "Check Your Email",
          description: "If an account exists with this email, you will receive password reset instructions.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error sending reset password email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to process your request at this time. Please try again later.",
        duration: 5000,
      });
    } finally {
      // Set a longer timeout before allowing another attempt
      setTimeout(() => {
        setIsSendingReset(false);
      }, 60000); // Wait 1 minute before allowing another attempt
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
            disabled={isLoading || isSendingReset}
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
            disabled={isLoading || isSendingReset}
          />
        </div>
        <Button
          type="button"
          variant="link"
          className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
          onClick={handleForgotPassword}
          disabled={isSendingReset}
        >
          {isSendingReset ? "Please wait..." : "Forgot your password?"}
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        <LogIn className="mr-2 h-4 w-4" />
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};