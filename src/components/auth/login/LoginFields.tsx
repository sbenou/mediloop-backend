import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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

    try {
      // First check if the email exists
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
        filters: {
          email: email
        }
      });

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "No account found with this email. Please sign up first.",
        });
        return;
      }

      toast({
        title: "Email Verified",
        description: "Please choose how you'd like to sign in.",
      });
      
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