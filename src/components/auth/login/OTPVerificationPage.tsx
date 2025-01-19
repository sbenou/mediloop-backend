import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { OTPVerificationForm } from './OTPVerificationForm';

export const OTPVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    console.log("OTPVerificationPage mounted with email:", email);
    if (!email) {
      console.log("No email found in location state, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  const handleBack = () => {
    navigate('/login', { replace: true });
  };

  if (!email) {
    return null;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Button 
            variant="ghost" 
            className="w-fit h-fit p-0 mb-4" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We've sent a verification code to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OTPVerificationForm email={email} />
        </CardContent>
      </Card>
    </div>
  );
};