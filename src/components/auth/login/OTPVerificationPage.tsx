import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { OTPVerificationForm } from './OTPVerificationForm';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getOTPEmail } from '@/utils/auth';
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = () => (
  <div className="space-y-6">
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground">
        An error occurred while loading the verification page.
      </p>
      <Link to="/login">
        <Button variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
      </Link>
    </div>
  </div>
);

export const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      console.log("Checking session and email validity...");
      
      // Check for expired OTP email
      const email = getOTPEmail();
      if (!email) {
        console.log("No valid email found, redirecting to login");
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please start the password reset process again.",
        });
        navigate('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session check result:", session ? "User authenticated" : "No active session");
      
      if (session) {
        console.log("User already authenticated, clearing OTP data and redirecting");
        // Clear OTP data if user is already authenticated
        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');
        navigate('/', { replace: true });
      }
    };
    checkSession();
  }, [navigate, toast]);

  const email = getOTPEmail();

  if (!email) {
    return (
      <div className="space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            No Email Found
          </h1>
          <p className="text-sm text-muted-foreground">
            The verification session has expired or is invalid. Please try the verification process again.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the verification code sent to {email}
          </p>
        </div>
        <OTPVerificationForm email={email} />
      </div>
    </ErrorBoundary>
  );
};