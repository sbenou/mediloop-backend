
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const Login = () => {
  const { isAuthenticated, isLoading, profile, userRole } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  
  // If user is authenticated but not redirecting yet, prepare redirect
  if (isAuthenticated && !redirecting && profile) {
    console.log("[Login] User authenticated, redirecting to dashboard with role:", profile.role || userRole);
    setRedirecting(true);
    
    // Get the correct dashboard route for this user
    const role = profile.role || userRole || 'patient';
    const redirectUrl = getDashboardRouteByRole(role);
    
    console.log("[Login] Redirecting to:", redirectUrl);
    
    // Use direct navigation for a clean redirect
    window.location.href = redirectUrl;
    return null;
  }
  
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
