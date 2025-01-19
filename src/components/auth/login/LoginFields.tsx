import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LoginFieldsProps {
  email: string;
  onEmailChange: (value: string) => void;
  isLoading: boolean;
  onEmailSent: () => void;
}

export const LoginFields = ({
  email,
  onEmailChange,
  isLoading,
  onEmailSent,
}: LoginFieldsProps) => {
  const { toast } = useToast();

  const handleEmailSubmit = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to continue.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    try {
      onEmailSent();
    } catch (error: any) {
      console.error('Email verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to verify email",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <Button
        type="button"
        className="w-full"
        onClick={handleEmailSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Continue with Email"}
      </Button>
    </div>
  );
};