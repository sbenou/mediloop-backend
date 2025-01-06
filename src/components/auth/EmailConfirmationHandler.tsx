import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const error_description = params.get('error_description');
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const type = params.get('type');

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
        // Set session if tokens are present
        if (access_token && refresh_token) {
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
        }
        
        toast({
          title: "Password Reset",
          description: "You can now reset your password.",
        });
        navigate('/reset-password');
        return;
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
  }, [navigate]);

  return null;
};

export default EmailConfirmationHandler;