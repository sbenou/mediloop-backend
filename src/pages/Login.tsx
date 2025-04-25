
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { useLoginManager } from "@/hooks/auth/useLoginManager";
import { useEffect, useState } from "react";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const { redirected } = useLoginManager();
  const [showManualRedirect, setShowManualRedirect] = useState(false);
  const navigate = useNavigate();

  // Show manual redirect button if authenticated but still on login page after delay
  useEffect(() => {
    if (isAuthenticated && profile?.role && !isLoading) {
      // If we're still on the login page after 3 seconds, show manual redirect option
      const redirectTimeout = setTimeout(() => {
        setShowManualRedirect(true);
        console.log("[Login] Navigation may be taking longer than expected, showing manual redirect option");
      }, 3000);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [isAuthenticated, profile, isLoading]);

  // Handle manual redirect
  const handleManualRedirect = () => {
    if (profile?.role) {
      const route = getDashboardRouteByRole(profile.role);
      console.log("[Login] Manual navigation to:", route);
      navigate(route, { replace: true });
    }
  };

  // Show loading state during initial load
  if (isLoading) {
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

  // If authenticated, show redirect state
  if (isAuthenticated) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">Redirecting...</CardTitle>
              <CardDescription>
                Please wait while we redirect you to your dashboard
              </CardDescription>
              
              {showManualRedirect && (
                <div className="mt-4">
                  <p className="text-amber-600 mb-2">Navigation may be taking longer than expected</p>
                  <Button onClick={handleManualRedirect} variant="default">
                    Continue to Dashboard
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show login form for unauthenticated users
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
