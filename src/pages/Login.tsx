
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  
  // Effect to handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && profile) {
      console.log("[Login] User authenticated with profile, preparing redirect for role:", profile.role);
      setRedirecting(true);
      
      const redirectUrl = getDashboardRouteByRole(profile.role);
      
      // Force direct URL navigation for pharmacists
      if (profile.role === 'pharmacist') {
        console.log("[Login] Pharmacist detected, using direct URL navigation to:", redirectUrl);
        // Short delay to ensure state updates before navigation
        const redirectTimeout = setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
        
        return () => clearTimeout(redirectTimeout);
      }
    }
  }, [isAuthenticated, profile, navigate]);
  
  // Handle manual redirect
  const handleForceRedirect = () => {
    const role = profile?.role || 'patient';
    const redirectUrl = getDashboardRouteByRole(role);
    console.log("[Login] Forcing redirect to:", redirectUrl);
    window.location.href = redirectUrl;
  };
  
  // Handle page reload
  const handleReload = () => {
    window.location.reload();
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
                Please wait while we verify your authentication status
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
          <CardContent className="flex flex-col items-center gap-2">
            {isAuthenticated && profile && redirecting && (
              <>
                <Button onClick={handleForceRedirect} variant="outline" className="w-full">
                  Force Navigation to Dashboard
                </Button>
                <Button onClick={handleReload} variant="outline" className="w-full">
                  Reload Page
                </Button>
              </>
            )}
            {/* Only redirect through React Router when not a pharmacist */}
            {isAuthenticated && profile && profile.role !== 'pharmacist' && (
              <Navigate to={getDashboardRouteByRole(profile.role)} replace />
            )}
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
