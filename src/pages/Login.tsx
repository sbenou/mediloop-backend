
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (isAuthenticated && user) {
        try {
          console.log('Checking user role for:', user.id);
          
          // Get user profile to check role
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Profile fetch error:', error);
            navigate('/dashboard');
            return;
          }
          
          console.log('User role found:', profile?.role);
          
          // Redirect based on role
          if (profile?.role === 'pharmacist') {
            console.log('Redirecting to pharmacy dashboard...');
            navigate('/pharmacy/dashboard', { replace: true });
          } else {
            console.log('Redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error('Error checking role:', err);
          navigate('/dashboard');
        }
      }
    };
    
    checkUserRole();
  }, [isAuthenticated, user, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If user is already authenticated, prevent showing the login page
  if (isAuthenticated) {
    return null; // Instead of returning Navigate, we handle the redirect in the useEffect hook
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
