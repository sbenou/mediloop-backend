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
      const access_token = params.get('access_token') || hashParams.get('access_token');
      const refresh_token = params.get('refresh_token') || hashParams.get('refresh_token');
      const type = params.get('type') || hashParams.get('type');
      const error = params.get('error') || hashParams.get('error');
      const error_description = params.get('error_description') || hashParams.get('error_description');

      console.log('Email confirmation params:', {
        error,
        error_description,
        type,
        code,
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

      // Handle recovery flow with code
      if (type === 'recovery' && code) {
        console.log('Handling recovery with code');
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (data.session) {
            toast({
              title: "Password Reset",
              description: "You can now reset your password.",
            });
            navigate('/reset-password', { replace: true });
            return;
          }
        } catch (error: any) {
          console.error('Recovery code exchange error:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to process recovery request",
          });
          navigate('/login', { replace: true });
          return;
        }
      }

      // If we have tokens directly, set the session
      if (access_token && refresh_token) {
        console.log('Setting session with tokens');
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) throw sessionError;

          if (type === 'recovery') {
            toast({
              title: "Password Reset",
              description: "You can now reset your password.",
            });
            navigate('/reset-password', { replace: true });
            return;
          } else if (type === 'signup') {
            toast({
              title: "Email Confirmed",
              description: "Your email has been successfully confirmed. You can now log in.",
            });
            navigate('/login', { replace: true });
            return;
          }
        } catch (error: any) {
          console.error('Authentication error:', error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: error.message || "Failed to process authentication request",
          });
          navigate('/login', { replace: true });
          return;
        }
      }

      // If we're on the callback route but don't have tokens or code
      if (location.pathname === '/auth/callback' && !code && !access_token) {
        console.log('No tokens or code found in callback URL, redirecting to login');
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