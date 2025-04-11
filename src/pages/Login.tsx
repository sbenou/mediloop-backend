
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const { isAuthenticated, isLoading, profile, userRole } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  
  // Effect to handle authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[Login] User authenticated, preparing redirect with role:", profile?.role || userRole);
      setRedirecting(true);
      
      // Get the correct dashboard route for this user
      const role = profile?.role || userRole || 'patient';
      const redirectUrl = getDashboardRouteByRole(role);
      
      console.log("[Login] Redirecting to:", redirectUrl, "for role:", role);
      
      // Set a redirect indicator in session storage
      sessionStorage.setItem('login_successful', 'true');
      sessionStorage.setItem('skip_dashboard_redirect', 'true');
      
      // Force direct URL navigation for all users to ensure clean redirect
      window.location.href = redirectUrl;
    }
  }, [isAuthenticated, profile, userRole, navigate]);
  
  // Show loading state when initial auth check is happening
  if (isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">Loading...</CardTitle>
              <CardDescription>
                Please wait while we verify your authentication status
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // When user is authenticated, show redirecting state
  if (isAuthenticated || redirecting) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-12 w-12 animate-spin text-primary" />
              <CardTitle className="text-2xl">Redirecting...</CardTitle>
              <CardDescription>
                Please wait while we redirect you to your dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            {isAuthenticated && (
              <Button 
                onClick={() => {
                  const role = profile?.role || userRole || 'patient';
                  window.location.href = getDashboardRouteByRole(role);
                }}
                variant="outline" 
                className="w-full"
              >
                Force Navigation to Dashboard
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              className="w-full"
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Standard login form when not authenticated
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
          <LoginForm onRedirectStart={() => setRedirecting(true)} />
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
