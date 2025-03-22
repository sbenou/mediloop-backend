
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";
import ConsultationsLoading from "@/components/teleconsultation/ConsultationsLoading";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();

  // Enhanced logging for debugging
  console.log("Login page render:", {
    isAuthenticated,
    isLoading,
    profileRole: auth.profile?.role,
    userId: auth.user?.id
  });

  useEffect(() => {
    // Only redirect when we have confirmed auth state: authenticated, not loading, profile exists
    if (isAuthenticated && !isLoading && auth.profile) {
      console.log('User authenticated with role:', auth.profile.role);
      
      // Store redirect info in localStorage for cross-tab sync
      try {
        localStorage.setItem('last_auth_event', JSON.stringify({
          type: 'LOGIN',
          timestamp: new Date().toISOString(),
          role: auth.profile.role,
          userId: auth.user?.id
        }));
      } catch (e) {
        console.error('Error storing auth event:', e);
      }
      
      // Direct role-based routing using profile.role
      const role = auth.profile.role;
      
      if (role === 'pharmacist') {
        console.log('Redirecting pharmacist to pharmacy dashboard');
        navigate('/pharmacy', { replace: true });
        return;
      }
      
      if (role === 'doctor') {
        console.log('Redirecting doctor to doctor dashboard');
        navigate('/doctor', { replace: true });
        return;
      }
      
      // Default redirection for all other authenticated users
      console.log('Redirecting to general dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, auth.profile, navigate]);

  // Show loading state with the new two-circle spinner component
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
