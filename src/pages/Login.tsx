
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      console.log('Login page mounted, checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }
      
      if (session?.user) {
        console.log('Active session found, checking role...');
        
        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // Redirect based on role
        if (profile?.role === 'pharmacist') {
          console.log('Pharmacist detected, redirecting to pharmacy dashboard...');
          navigate('/pharmacy/dashboard', { replace: true });
        } else {
          console.log('Regular user detected, redirecting to standard dashboard...');
          navigate('/dashboard', { replace: true });
        }
      } else {
        console.log('No active session found');
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in Login:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, checking role before redirecting...');
        
        // Get user profile to check role
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error('Profile fetch error after login:', error);
              navigate('/dashboard', { replace: true });
              return;
            }
            
            // Redirect based on role
            if (profile?.role === 'pharmacist') {
              console.log('Pharmacist detected, redirecting to pharmacy dashboard...');
              navigate('/pharmacy/dashboard', { replace: true });
            } else {
              console.log('Regular user detected, redirecting to standard dashboard...');
              navigate('/dashboard', { replace: true });
            }
          });
      }
    });

    return () => {
      console.log('Login page unmounting, cleaning up...');
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Only show loading state for a brief moment during initial auth check
  if (isLoading) {
    console.log('Auth state is loading...');
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

  // If user is already authenticated, redirect based on role
  if (isAuthenticated) {
    console.log('User is authenticated, redirecting based on role...');
    if (userRole === 'pharmacist') {
      return <Navigate to="/pharmacy/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Show login form
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg origin-center transform transition-all duration-700 ease-in-out hover:shadow-xl animate-[scale-in_0.7s_ease-out] motion-reduce:transition-none motion-reduce:hover:transform-none">
        <CardHeader className="space-y-1 text-left">
          <CardTitle className="text-2xl font-bold text-left">Login</CardTitle>
          <CardDescription className="text-left">
            Enter your email to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={() => {
            console.log('Login form success callback executed');
          }} />
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
