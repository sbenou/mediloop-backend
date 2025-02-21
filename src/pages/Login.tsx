
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
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
        console.log('Active session found, redirecting to home...');
        navigate('/', { replace: true });
      } else {
        console.log('No active session found');
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in Login:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, redirecting to home...');
        navigate('/', { replace: true });
      }
    });

    return () => {
      console.log('Login page unmounting, cleaning up...');
      subscription.unsubscribe();
    };
  }, [navigate]);

  console.log('Login render state:', { isAuthenticated, isLoading });

  if (isAuthenticated) {
    console.log('User is authenticated, redirecting to home...');
    return <Navigate to="/" replace />;
  }

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
