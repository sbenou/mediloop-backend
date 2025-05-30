
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordFields } from "./login/PasswordFields";
import { AuthOptions } from "./login/AuthOptions";
import { OAuthButtons } from "./OAuthButtons";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const { toast } = useToast();

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
    setShowResetOptions(true);
  };

  const handleLoginSuccess = async () => {
    console.log('Login success handled by usePasswordLogin');
    // Navigation is now handled directly in usePasswordLogin
  };

  const handleBackToEmail = () => {
    setShowPassword(false);
    setShowResetOptions(false);
  };

  const handleBackToPassword = () => {
    setShowResetOptions(false);
  };

  if (showResetOptions) {
    return (
      <AuthOptions 
        email={email} 
        onBack={handleBackToPassword}
      />
    );
  }

  return (
    <div className="space-y-4 text-left !text-start w-full">
      <div>
        {showPassword && (
          <Button
            type="button"
            variant="ghost"
            className="p-0 h-auto font-normal hover:bg-transparent mb-4"
            onClick={handleBackToEmail}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to email
          </Button>
        )}
        <form onSubmit={handleContinue} className="space-y-4">
          <div className="space-y-2 text-start">
            <Label htmlFor="email" className="text-start block">Email</Label>
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
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
            >
              Continue with Email
            </button>
          )}
        </form>
      </div>

      {showPassword && (
        <PasswordFields
          email={email}
          onSuccess={handleLoginSuccess}
          onForgotPassword={handleForgotPassword}
        />
      )}

      {/* OAuth buttons - only show when not in password or reset mode, with more spacing */}
      {!showPassword && !showResetOptions && (
        <div className="mt-8">
          <OAuthButtons />
        </div>
      )}
    </div>
  );
}
