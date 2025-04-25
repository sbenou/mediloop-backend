
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { useLoginManager } from "@/hooks/auth/useLoginManager";
import { useEffect } from "react";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const Login = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const { redirected, navigationInProgress } = useLoginManager();

  // Escape hatch: Force navigation if auth is complete but redirect is stuck
  useEffect(() => {
    if (isAuthenticated && profile?.role && !isLoading) {
      const forceNavigationTimeout = setTimeout(() => {
        // If we're still on the login page after 2 seconds, force navigation
        const route = getDashboardRouteByRole(profile.role);
        console.log("[Login] Force navigation fallback to:", route);
        window.location.href = route;
      }, 2000);
      
      return () => clearTimeout(forceNavigationTimeout);
    }
  }, [isAuthenticated, profile, isLoading]);

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
