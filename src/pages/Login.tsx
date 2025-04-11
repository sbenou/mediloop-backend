
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  
  // Helper to determine the correct redirect URL based on user role
  const getRedirectUrl = () => {
    if (profile?.role === 'pharmacist') {
      return '/dashboard?view=pharmacy&section=dashboard';
    }
    if (profile?.role === 'doctor') {
      return '/dashboard?section=dashboard';
    }
    return '/dashboard';
  };

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
                Please wait while we load your profile
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // When user is authenticated, redirect to dashboard immediately
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
          {isAuthenticated && <Navigate to={getRedirectUrl()} replace />}
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
