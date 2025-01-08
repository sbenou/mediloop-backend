import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get URL parameters from both search and hash
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      
      console.log('Full URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      console.log('Path:', location.pathname);
      
      const code = params.get('code');
      const type = params.get('type') || hashParams.get('type');
      const error = params.get('error') || hashParams.get('error');
      const error_description = params.get('error_description') || hashParams.get('error_description');

      console.log('Email confirmation params:', {
        error,
        error_description,
        type,
        code,
        fullUrl: window.location.href
      });

      if (error || error_description) {
        console.error('Email confirmation error:', { error, error_description });
        toast({
          variant: "destructive",
          title: "Error",
          description: error_description || "Failed to process request",
        });
        navigate('/login', { replace: true });
        return;
      }

      // Handle recovery flow with code
      if (type === 'recovery' && code) {
        console.log('Handling recovery with code');
        try {
          // Instead of exchanging code for session, verify the code is valid
          const { error: verificationError } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'recovery'
          });

          if (verificationError) throw verificationError;

          // Store the recovery code in sessionStorage temporarily
          sessionStorage.setItem('recovery_code', code);
          
          // Redirect to reset password page
          navigate('/reset-password', { replace: true });
          return;
        } catch (error: any) {
          console.error('Recovery code verification error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Invalid or expired recovery link. Please request a new password reset.",
          });
          navigate('/login', { replace: true });
          return;
        }
      }

      // Handle signup confirmation
      if (type === 'signup' && code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (data.session) {
            toast({
              title: "Email Confirmed",
              description: "Your email has been successfully confirmed. You can now log in.",
            });
            navigate('/login', { replace: true });
            return;
          }
        } catch (error: any) {
          console.error('Signup confirmation error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to confirm email",
          });
          navigate('/login', { replace: true });
          return;
        }
      }

      // If we're on the callback route but don't have a valid code
      if (location.pathname === '/auth/callback' && !code) {
        console.log('No code found in callback URL, redirecting to login');
        navigate('/login', { replace: true });
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast, location]);

  return null;
};

export default EmailConfirmationHandler;