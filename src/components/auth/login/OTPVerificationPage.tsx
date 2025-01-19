import { useLocation, useNavigate } from 'react-router-dom';
import { OTPVerificationForm } from './OTPVerificationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

export const OTPVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    console.log("OTPVerificationPage mounted with email:", email);
    if (!email) {
      console.log("No email found in location state, redirecting to login");
      navigate('/login');
    }
  }, [email, navigate]);

  if (!email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Access</CardTitle>
          <CardDescription>
            Please request a verification code first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Verification Code</CardTitle>
        <CardDescription>
          We've sent a verification code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OTPVerificationForm 
          email={email}
        />
      </CardContent>
    </Card>
  );
};