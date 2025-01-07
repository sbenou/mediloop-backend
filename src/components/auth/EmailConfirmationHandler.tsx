import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for hash parameters (Supabase sends tokens in URL hash for security)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Check for error parameters in the regular search params
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const error_description = params.get('error_description');

      console.log('Email confirmation params:', { error, error_description, type, access_token });

      if (error || error_description) {
        console.error('Email confirmation error:', { error, error_description });
        toast({
          variant: "destructive",
          title: "Email Confirmation Error",
          description: error_description || "Failed to confirm email address",
        });
        navigate('/login');
        return;
      }

      // Handle password reset flow
      if (type === 'recovery') {
        console.log('Handling password recovery flow');
        try {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: access_token || '',
            refresh_token: refresh_token || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: "Failed to set authentication session",
            });
            navigate('/login');
            return;
          }

          console.log('Successfully set session, redirecting to reset-password');
          toast({
            title: "Reset Password",
            description: "You can now reset your password.",
          });
          
          navigate('/reset-password', { replace: true });
          return;
        } catch (error: any) {
          console.error('Password recovery error:', error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Failed to process password reset request",
          });
          navigate('/login');
          return;
        }
      }

      // Handle signup confirmation flow
      if (type === 'signup' && access_token && refresh_token) {
        console.log('Setting session with tokens:', { access_token, refresh_token });
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Failed to set authentication session",
          });
          navigate('/login');
          return;
        }

        console.log('Email confirmation successful');
        toast({
          title: "Email Confirmed",
          description: "Your email has been successfully confirmed. You can now log in.",
        });
        navigate('/login');
      }

      // Clear URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  return null;
};

export default EmailConfirmationHandler;