import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import OTPVerificationForm from "./OTPVerificationForm";
import { ErrorBoundary } from "react-error-boundary";
import { useToast } from "@/hooks/use-toast";

function ErrorFallback({ error }: { error: Error }) {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Something went wrong. Please try again.",
    });
    navigate('/login');
  }, [toast, navigate]);

  return null;
}

export const OTPVerificationPage = () => {
  const [email, setEmail] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Getting OTP email from available sources...");
    
    // Try to get email from location state
    const stateEmail = location.state?.email;
    if (stateEmail) {
      console.log("Email found in location state:", stateEmail);
      setEmail(stateEmail);
      return;
    }

    // Try to get email from localStorage
    const storedEmail = localStorage.getItem('otp_email');
    const expiryTime = localStorage.getItem('otp_email_expiry');
    
    if (storedEmail && expiryTime) {
      const hasExpired = new Date().getTime() > parseInt(expiryTime);
      
      if (hasExpired) {
        console.log("Stored email has expired");
        localStorage.removeItem('otp_email');
        localStorage.removeItem('otp_email_expiry');
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please start the verification process again.",
        });
        navigate('/login');
        return;
      }
      
      console.log("Email found in localStorage:", storedEmail);
      setEmail(storedEmail);
      return;
    }

    // If no email is found, redirect to login
    console.log("No email found, redirecting to login");
    toast({
      variant: "destructive",
      title: "Invalid Access",
      description: "Please start the verification process from the login page.",
    });
    navigate('/login');
  }, [location.state, navigate, toast]);

  if (!email) {
    return null;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Verify your email
            </CardTitle>
            <CardDescription className="text-center">
              Enter the verification code sent to {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OTPVerificationForm 
              email={email} 
              onSuccess={() => {
                console.log("OTP verification successful");
                navigate('/', { replace: true });
              }} 
            />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};
