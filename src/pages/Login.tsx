
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader } from "lucide-react";

const Login = () => {
  const { isAuthenticated, isLoading, user, profile, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const redirectAttempted = useRef(false);
  const [navLock, setNavLock] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      // Prevent multiple redirects - only attempt once
      if (isAuthenticated && user && !redirectAttempted.current && !navLock && !redirecting) {
        try {
          console.log('Checking user role for:', user.id);
          redirectAttempted.current = true;
          setNavLock(true);
          setRedirecting(true);
          
          if (!profile) {
            console.error('No profile found, cannot redirect');
            setNavLock(false);
            setRedirecting(false);
            return;
          }
          
          console.log('User role found:', profile.role, 'Is pharmacist:', isPharmacist);

          // Force session storage on successful login for ALL user types
          try {
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
          } catch (sessionError) {
            console.error('Error getting/storing session:', sessionError);
          }
          
          // Handle pharmacy role with completely separate approach
          if (profile.role === 'pharmacist' || isPharmacist) {
            console.log('Redirecting pharmacist to pharmacy dashboard with direct navigation');
            // Use a hard redirect with window.location to avoid React Router issues
            window.location.href = '/pharmacy';
            return;
          }
          
          // Special handling for doctors
          if (profile.role === 'doctor') {
            console.log('Redirecting doctor to doctor dashboard view');
            navigate('/doctor', { replace: true });
            return;
          }
          
          // For all other users, redirect to the universal dashboard
          console.log('Redirecting to universal dashboard...');
          navigate('/dashboard', { replace: true });
        } catch (err) {
          console.error('Error checking role:', err);
          setNavLock(false);
          setRedirecting(false);
          navigate('/dashboard');
        }
      }
    };
    
    checkUserRole();
  }, [isAuthenticated, user, profile, navigate, isPharmacist, navLock, redirecting]);

  // Show loading state
  if (isLoading || redirecting) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">{redirecting ? "Redirecting..." : "Loading..."}</CardTitle>
              <CardDescription>
                {redirecting 
                  ? "Please wait while we redirect you to the appropriate dashboard" 
                  : "Please wait while we load your profile"}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If user is already authenticated, prevent showing the login page but avoid recursive redirects
  if (isAuthenticated && !redirectAttempted.current) {
    redirectAttempted.current = true;
    setRedirecting(true);
    
    // Check if the user is a pharmacist
    if (profile?.role === 'pharmacist' || isPharmacist) {
      console.log('Already authenticated as pharmacist, redirecting to pharmacy dashboard');
      // Use direct window location for pharmacist to avoid React Router conflicts
      window.location.href = '/pharmacy';
    } else if (profile?.role === 'doctor') {
      console.log('Already authenticated as doctor, redirecting to doctor dashboard');
      navigate('/doctor', { replace: true });
    } else {
      // For all other users
      navigate('/dashboard', { replace: true });
    }
    
    // Show a temporary loading state while redirecting
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="text-2xl">Redirecting...</CardTitle>
              <CardDescription>
                Please wait while we redirect you to the appropriate dashboard
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
