import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get the URL parameters
      const params = new URLSearchParams(window.location.search);
      
      // Get the hash parameters (Supabase sometimes sends tokens in hash)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      
      // Log full URL and hash for debugging
      console.log('Full URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      
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
          title: "Email Confirmation Error",
          description: error_description || "Failed to confirm email address",
        });
        navigate('/login', { replace: true });
        return;
      }

      // Handle password recovery flow
      if (type === 'recovery' || (access_token && !type)) {
        console.log('Handling password recovery flow');
        try {
          if (!access_token || !refresh_token) {
            console.error('Missing tokens for recovery flow');
            toast({
              variant: "destructive",
              title: "Recovery Error",
              description: "Invalid recovery link. Please request a new password reset.",
            });
            navigate('/login', { replace: true });
            return;
          }

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
            navigate('/login', { replace: true });
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
          navigate('/login', { replace: true });
          return;
        }
      }

      // Handle signup confirmation flow
      if (type === 'signup' && access_token && refresh_token) {
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
          navigate('/login', { replace: true });
          return;
        }

        toast({
          title: "Email Confirmed",
          description: "Your email has been successfully confirmed. You can now log in.",
        });
        navigate('/login', { replace: true });
      }

      // Clear URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  return null;
};

export default EmailConfirmationHandler;