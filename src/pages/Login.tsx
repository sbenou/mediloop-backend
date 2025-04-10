
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { useLoginManager } from "@/hooks/auth/useLoginManager";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const Login = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const { redirected } = useLoginManager(); // Use the login manager to handle redirects
  const navigate = useNavigate();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [manualRedirectInProgress, setManualRedirectInProgress] = useState(false);
  
  // Check if we just attempted a login
  const loginSuccessful = sessionStorage.getItem('login_successful') === 'true';
  
  // Direct redirection for already authenticated users
  useEffect(() => {
    if (isAuthenticated && profile && !redirected && !redirectAttempted && !manualRedirectInProgress && !loginSuccessful) {
      setRedirectAttempted(true);
      setManualRedirectInProgress(true);
      const role = profile.role;
      
      // Set flag to indicate direct login navigation and ensure skip_dashboard_redirect is set
      sessionStorage.setItem('skip_dashboard_redirect', 'true');
      
      // For pharmacists, use a more direct approach to ensure correct redirect
      if (role === 'pharmacist') {
        console.log(`[Login] Pharmacist user detected, using direct navigation to pharmacy dashboard`);
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
        return;
      }
      
      // Get the correct route for other user roles
      const route = getDashboardRouteByRole(role);
      console.log(`[Login] User already authenticated with role ${role}, redirecting to: ${route}`);
      
      // Use window.location for a full page refresh to ensure clean state
      window.location.href = route;
    }
  }, [isAuthenticated, profile, navigate, redirected, redirectAttempted, manualRedirectInProgress, loginSuccessful]);
  
  // Clean up the login flag once we've processed it
  useEffect(() => {
    // Small delay to ensure redirect has time to process
    if (loginSuccessful) {
      const timer = setTimeout(() => {
        sessionStorage.removeItem('login_successful');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loginSuccessful]);

  // Show loading state
  if (isLoading || manualRedirectInProgress || loginSuccessful) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">Loading...</CardTitle>
              <CardDescription>
                {loginSuccessful ? "Login successful! Redirecting you to your dashboard..." : "Please wait while we load your profile"}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If already authenticated and redirected, show a temporary loading state
  if (isAuthenticated) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">Redirecting...</CardTitle>
              <CardDescription>
                Please wait while we redirect you to the appropriate dashboard
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show login form
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-left">
          <CardTitle className="text-2xl font-bold text-left">Login</CardTitle>
          <CardDescription className="text-left">
            Enter your email to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
