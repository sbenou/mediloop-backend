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
      
      // Try to get tokens from both search params and hash
      const access_token = params.get('access_token') || hashParams.get('access_token');
      const refresh_token = params.get('refresh_token') || hashParams.get('refresh_token');
      const type = params.get('type') || hashParams.get('type');
      const error = params.get('error') || hashParams.get('error');
      const error_description = params.get('error_description') || hashParams.get('error_description');

      console.log('Email confirmation params:', {
        error,
        error_description,
        type,
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
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

      // If we have tokens, set the session
      if (access_token && refresh_token) {
        console.log('Setting session with tokens');
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) throw sessionError;

          // Handle different types of confirmations
          if (type === 'recovery' || type === 'passwordReset') {
            toast({
              title: "Reset Password",
              description: "You can now reset your password.",
            });
            navigate('/reset-password', { replace: true });
          } else if (type === 'signup') {
            toast({
              title: "Email Confirmed",
              description: "Your email has been successfully confirmed. You can now log in.",
            });
            navigate('/login', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        } catch (error: any) {
          console.error('Authentication error:', error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: error.message || "Failed to process authentication request",
          });
          navigate('/login', { replace: true });
        }
      } else if (location.pathname === '/auth/callback') {
        // If we're on the callback route but don't have tokens, redirect to login
        console.log('No tokens found in callback URL, redirecting to login');
        navigate('/login', { replace: true });
      }

      // Clear URL parameters
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast, location]);

  return null;
};

export default EmailConfirmationHandler;