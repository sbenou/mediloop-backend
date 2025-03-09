
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { isAuthenticated, isLoading, user, profile, isPharmacist } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (isAuthenticated && user) {
        try {
          console.log('Checking user role for:', user.id);
          
          if (!profile) {
            console.error('No profile found, cannot redirect');
            return;
          }
          
          console.log('User role found:', profile.role);
          console.log('Is pharmacist check:', isPharmacist, profile.role === 'pharmacist');

          // Force session storage on successful login for ALL user types
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Get the storage key
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            
            // Store in localStorage to ensure persistence
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              console.log('Session explicitly stored in localStorage upon login success');
              
              // Set in session storage too for redundancy
              window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
              console.log('Session also stored in sessionStorage for redundancy');
              
              // Broadcast the login event to other tabs
              try {
                const loginEvent = { 
                  type: 'LOGIN', 
                  userId: session.user.id, 
                  timestamp: Date.now() 
                };
                localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
                // Force the event to trigger
                localStorage.removeItem('last_auth_event');
                localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
              } catch (eventError) {
                console.error('Error broadcasting login event:', eventError);
              }
            } catch (storageError) {
              console.error('Error storing session:', storageError);
            }
          }
          
          // Enhanced pharmacist detection with multiple checks
          const isUserPharmacist = profile.role === 'pharmacist' || isPharmacist;
          
          // Redirect based on role
          if (isUserPharmacist) {
            console.log('Redirecting pharmacist to pharmacy dashboard view');
            navigate('/dashboard?view=pharmacy&section=dashboard', { replace: true });
          } else {
            console.log('Redirecting to universal dashboard');
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error('Error checking role:', err);
          navigate('/dashboard');
        }
      }
    };
    
    checkUserRole();
  }, [isAuthenticated, user, profile, navigate, isPharmacist]);

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
    // Enhanced pharmacist detection with multiple checks
    const isUserPharmacist = profile?.role === 'pharmacist' || isPharmacist;
    
    if (isUserPharmacist) {
      navigate('/dashboard?view=pharmacy&section=dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
    return null;
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
