
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const Login = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (isAuthenticated && user) {
        try {
          console.log('Login - Checking user role for:', user.id);
          
          // Get user profile to check role
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Profile fetch error:', error);
            toast({
              title: "Error",
              description: "Could not fetch your user profile. Please try again.",
              variant: "destructive"
            });
            navigate('/dashboard');
            return;
          }
          
          console.log('Login - User role found:', profile?.role);

          // Force session storage on successful login for ALL user types
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Get the storage key
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            
            // Store in both localStorage and cookies for redundancy
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              
              // Also set in cookie with 7-day expiry (for all users)
              const expires = new Date();
              expires.setDate(expires.getDate() + 7);
              
              document.cookie = [
                `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(session))}`,
                `expires=${expires.toUTCString()}`,
                'path=/',
                'secure',
                'samesite=strict',
              ].join('; ');
              
              console.log('Session explicitly stored for all user types upon login success');
            } catch (storageError) {
              console.error('Error storing session:', storageError);
            }
          }
          
          // Redirect based on role
          if (!profile || !profile.role) {
            console.error('Login - No role found in profile, defaulting to user dashboard');
            navigate('/dashboard', { replace: true });
            return;
          }
          
          if (profile.role === 'superadmin') {
            console.log('Login - Redirecting to superadmin dashboard...');
            navigate('/superadmin-dashboard', { replace: true });
          } else if (profile.role === 'pharmacist') {
            console.log('Login - Redirecting to pharmacy dashboard...');
            navigate('/pharmacy/dashboard', { replace: true });
          } else {
            console.log('Login - Redirecting to user dashboard...');
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error('Error checking role:', err);
          toast({
            title: "Error",
            description: "An error occurred during login redirection. Please try again.",
            variant: "destructive"
          });
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
