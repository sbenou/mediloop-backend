
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { persistV2SessionFromBackendLogin } from '@/lib/auth/v2SessionStorage';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const token = params.get('token');
        const errorParam = params.get('error');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');
        
        // If we have error params in the URL, show them instead of processing
        if (errorParam || errorCode || errorDescription) {
          console.error('Error from URL parameters:', { errorParam, errorCode, errorDescription });
          
          // Create a user-friendly error message
          let errorMessage = 'There was a problem verifying your email.';
          
          if (errorDescription) {
            // Convert URL-encoded spaces to actual spaces and capitalize first letter
            errorMessage = errorDescription
              .replace(/\+/g, ' ')
              .replace(/^./, str => str.toUpperCase());
          }
          
          if (errorCode === 'otp_expired') {
            errorMessage = 'This verification link has expired or already been used. If needed, you can request a new verification email.';
          }
          
          setError(errorMessage);
          setIsProcessing(false);
          return;
        }
        
        // New backend flow: /verify-email?token=<uuid>
        if (token) {
          const response = await fetch(
            `${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
            { method: 'GET' },
          );
          const data = await response.json().catch(() => ({})) as {
            error?: string;
            message?: string;
            access_token?: string;
            user?: { id?: string };
          };

          if (!response.ok || !data.access_token || !data.user?.id) {
            setError(data.error || 'Failed to verify email');
            setIsProcessing(false);
            return;
          }

          // Keep both legacy and V2 storage in sync
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem(
            'mediloop_session_sync',
            JSON.stringify({
              accessToken: data.access_token,
              refreshToken: data.access_token,
              userId: data.user.id,
              timestamp: Date.now(),
            }),
          );
          persistV2SessionFromBackendLogin({
            accessToken: data.access_token,
            refreshToken: data.access_token,
            userId: data.user.id,
          });

          console.log('Email verified successfully via backend token');
          toast({
            title: "Email Confirmed",
            description: data.message || "Your email has been confirmed.",
          });
          navigate('/dashboard');
          return;
        }

        // Legacy Supabase flow: /verify-email?code=<token_hash>
        console.log('Email confirmation code:', code);
        if (!code) {
          setError('No confirmation code or token found in URL');
          setIsProcessing(false);
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: 'signup'
        });

        if (verifyError) {
          console.error('Verification error:', verifyError);
          setError(verifyError.message || 'Failed to verify email');
          setIsProcessing(false);
          return;
        }

        console.log('Email verified successfully');
        toast({
          title: "Email Confirmed",
          description: "Your email has been confirmed. You can now log in.",
        });
        navigate('/login');
      } catch (err) {
        console.error('Email confirmation error:', err);
        setError('An unexpected error occurred during verification');
        setIsProcessing(false);
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {isProcessing 
              ? 'We are verifying your email address...'
              : error 
                ? 'There was a problem verifying your email'
                : 'Your email has been verified successfully!'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 pt-4">
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : error ? (
            <>
              <p className="text-destructive">{error}</p>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button onClick={handleGoToLogin}>
                  Go to Login
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGoToLogin}>
              Continue to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmationHandler;
