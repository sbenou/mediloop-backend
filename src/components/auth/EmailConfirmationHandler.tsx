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

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

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
    };

    handleEmailConfirmation();
  }, [navigate]);

  return null;
};

export default EmailConfirmationHandler;