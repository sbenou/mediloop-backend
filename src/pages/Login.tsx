
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginManager } from "@/hooks/auth/useLoginManager";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const Login = () => {
  const { isAuthenticated, isLoading, profile, userRole } = useAuth();
  const { redirected } = useLoginManager(); // Use the login manager to handle redirects
  const navigate = useNavigate();
  const [loadingTime, setLoadingTime] = useState(0);

  // Timer for tracking loading time
  useEffect(() => {
    let timer: number | null = null;
    
    if (isAuthenticated && !redirected && isLoading) {
      timer = window.setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isAuthenticated, redirected, isLoading]);

  // Handle manual navigation when auto-redirect fails
  const handleManualNavigation = () => {
    const role = profile?.role || userRole || 'user';
    const dashboardRoute = role === 'pharmacist' 
      ? '/dashboard?view=pharmacy&section=dashboard'
      : getDashboardRouteByRole(role);
      
    // Use window.location for a clean redirect
    window.location.href = dashboardRoute;
  };

  // Show loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">Loading...</CardTitle>
              <CardDescription>
                Please wait while we load your profile
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
              <Loader className="h-12 w-12 animate-spin text-primary" />
              <CardTitle className="text-2xl">Redirecting...</CardTitle>
              <CardDescription>
                Please wait while we redirect you to the appropriate dashboard
              </CardDescription>
              {loadingTime > 2 && (
                <div className="text-xs text-muted-foreground">
                  <p>Role: {profile?.role || userRole || 'Unknown'} | Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
                </div>
              )}
              {loadingTime > 5 && (
                <p className="text-amber-500 text-sm">
                  Taking longer than expected... ({loadingTime}s)
                </p>
              )}
            </div>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2 items-center justify-center">
            <Button 
              onClick={handleManualNavigation}
              variant="default" 
              className="text-sm"
            >
              Continue to dashboard
            </Button>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs text-blue-500 hover:underline mt-2"
            >
              Reload page
            </button>
          </CardFooter>
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
