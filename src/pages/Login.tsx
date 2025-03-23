
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useRef } from "react";
import { Loader } from "lucide-react";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();
  const redirectAttempted = useRef(false);

  // Enhanced logging for debugging
  console.log("Login page render:", {
    isAuthenticated,
    isLoading,
    profileRole: auth.profile?.role,
    userId: auth.user?.id,
    redirectAttempted: redirectAttempted.current
  });

  useEffect(() => {
    const checkUserRole = async () => {
      // Only redirect if authenticated, not loading, profile exists, and we haven't already redirected
      if (isAuthenticated && !isLoading && auth.profile && !redirectAttempted.current) {
        redirectAttempted.current = true;
        
        console.log('User role found for redirect:', auth.profile.role);

        // Special handling for pharmacists - directly go to the pharmacy page
        if (auth.profile.role === 'pharmacist') {
          console.log('Already authenticated as pharmacist, redirecting to pharmacy dashboard');
          navigate('/pharmacy', { replace: true });
          return;
        }
        
        // Special handling for doctors
        if (auth.profile.role === 'doctor') {
          console.log('Already authenticated as doctor, redirecting to doctor dashboard');
          navigate('/doctor', { replace: true });
          return;
        }
        
        // For all other users, redirect to the universal dashboard
        navigate('/dashboard', { replace: true });
      }
    };
    
    checkUserRole();
  }, [isAuthenticated, isLoading, auth.profile, navigate]);

  // Show loading state
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
