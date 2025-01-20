import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { OTPVerificationForm } from './OTPVerificationForm';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getOTPEmail } from '@/utils/auth';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ErrorFallback = () => (
  <div className="container mx-auto px-4 py-8">
    <Card>
      <CardContent className="space-y-4 text-center py-6">
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          An error occurred while loading the verification page.
        </CardDescription>
        <Link to="/login">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </CardContent>
    </Card>
  </div>
);

export const OTPVerificationPage = () => {
  const navigate = useNavigate();
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
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="space-y-4 text-center py-6">
            <CardTitle>No Email Found</CardTitle>
            <CardDescription>
              The verification session has expired or is invalid. Please try the verification process again.
            </CardDescription>
            <Link to="/login">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Verify your email
            </CardTitle>
            <CardDescription className="text-center">
              Enter the verification code sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OTPVerificationForm email={email} />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};