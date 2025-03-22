
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { getDashboardPath } from "@/services/authRedirectService";
import ConsultationsLoading from "@/components/teleconsultation/ConsultationsLoading";

const Login = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const navigate = useNavigate();

  // Enhanced logging for debugging
  console.log("Login page render:", {
    isAuthenticated,
    isLoading,
    userRole
  });

  useEffect(() => {
    // Only redirect when we have confirmed auth state: authenticated and role is known
    if (isAuthenticated && !isLoading && userRole) {
      console.log('User authenticated with role:', userRole);
      
      // Use the common service to ensure user is on the correct dashboard
      const dashboardPath = getDashboardPath(userRole);
      console.log('Redirecting to dashboard:', dashboardPath);
      
      // Use navigate for SPA navigation instead of hard refresh
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, userRole, navigate]);

  // Show loading state with the spinner component
  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <ConsultationsLoading />
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

  // If already authenticated, don't show login form
  if (isAuthenticated && userRole) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <ConsultationsLoading />
              <CardTitle className="text-2xl">Redirecting...</CardTitle>
              <CardDescription>
                Taking you to your dashboard
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
