
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordFields } from "./login/PasswordFields";
import { AuthOptions } from "./login/AuthOptions";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { storeSession } from "@/lib/auth/sessionUtils";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Log when the component mounts for debugging
  useEffect(() => {
    console.log("[LoginForm][DEBUG] LoginForm component mounted");
    
    // Check for any existing session storage flags
    console.log("[LoginForm][DEBUG] Session storage state:", {
      login_successful: sessionStorage.getItem('login_successful'),
      skip_dashboard_redirect: sessionStorage.getItem('skip_dashboard_redirect'),
      dashboard_redirect_count: sessionStorage.getItem('dashboard_redirect_count'),
      dashboard_mount_count: sessionStorage.getItem('dashboard_mount_count'),
      pharmacy_redirect_count: sessionStorage.getItem('pharmacy_redirect_count'),
    });
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginForm][DEBUG] Continue clicked with email:', email);

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
    console.log('[LoginForm][DEBUG] Forgot password clicked');
    setShowResetOptions(true);
  };

  const handleLoginSuccess = async () => {
    console.log('[LoginForm][DEBUG] Login success, checking session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[LoginForm][DEBUG] Session check error after login:', error);
      return;
    }

    if (session?.user) {
      console.log('[LoginForm][DEBUG] Valid session found, proceeding with success callback');
      
      // Explicitly store the session to ensure it persists
      storeSession(session);
      
      // Check user role and redirect accordingly
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('[LoginForm][DEBUG] Error fetching profile:', profileError);
          toast({
            variant: "destructive",
            title: "Profile Error",
            description: "There was an error loading your profile. Please try again.",
          });
          return;
        }
        
        // Set navigation flags
        sessionStorage.setItem('login_successful', 'true');
        sessionStorage.setItem('skip_dashboard_redirect', 'true');

        // Clear any existing redirect counters
        sessionStorage.removeItem('dashboard_redirect_count');
        sessionStorage.removeItem('dashboard_mount_count');
        sessionStorage.removeItem('pharmacy_redirect_count');
        
        console.log('[LoginForm][DEBUG] User role determined:', profile?.role);
        
        // Special handling for pharmacists to ensure correct route loading
        if (profile?.role === 'pharmacist') {
          console.log('[LoginForm][DEBUG] Pharmacist detected, using direct navigation');
          console.log('[LoginForm][DEBUG] Navigating to: /dashboard?view=pharmacy&section=dashboard');
          
          // Add a short delay to ensure session is properly stored
          setTimeout(() => {
            window.location.href = '/dashboard?view=pharmacy&section=dashboard';
          }, 200);
          return;
        }
        
        // Use the utility to get the appropriate dashboard route for other roles
        const route = getDashboardRouteByRole(profile?.role);
        console.log(`[LoginForm][DEBUG] Redirecting user with role ${profile?.role} to ${route}`);
        
        // Use direct window.location for most reliable navigation
        setTimeout(() => {
          window.location.href = route;
        }, 200);
      } catch (err) {
        console.error('[LoginForm][DEBUG] Error during role check:', err);
        toast({
          variant: "destructive",
          title: "Navigation Error",
          description: "There was an error redirecting you. Please try again.",
        });
      }
    } else {
      console.error('[LoginForm][DEBUG] No session found after successful login');
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
}
