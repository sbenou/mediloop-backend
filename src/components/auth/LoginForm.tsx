
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordFields } from "./login/PasswordFields";
import { AuthOptions } from "./login/AuthOptions";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    console.log('Login success, checking session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error after login:', error);
      return;
    }

    if (session?.user) {
      console.log('Valid session found, proceeding with success callback');
      // Check user role and redirect accordingly
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          navigate('/dashboard');
          return;
        }
        
        // Store login event in localStorage for cross-tab sync
        try {
          localStorage.setItem('last_auth_event', JSON.stringify({
            type: 'LOGIN',
            timestamp: new Date().toISOString(),
            role: profile.role,
            userId: session.user.id
          }));
        } catch (e) {
          console.error('Error storing auth event:', e);
        }
        
        if (profile?.role === 'superadmin') {
          navigate('/superadmin/dashboard', { replace: true });
        } else if (profile?.role === 'pharmacist') {
          // Use window.location.href for a hard redirect to ensure complete page refresh
          window.location.href = '/pharmacy';
        } else if (profile?.role === 'doctor') {
          // Use window.location.href for a hard redirect to ensure complete page refresh
          window.location.href = '/doctor';
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Error during role check:', err);
        navigate('/dashboard'); // Fallback redirect
      }
    } else {
      console.error('No session found after successful login');
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Failed to establish session. Please try again.",
      });
    }
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
    </div>
  );
};
