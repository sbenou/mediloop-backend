import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      const code = url.searchParams.get('code');
      const type = url.searchParams.get('type');
      
      console.log('Full URL:', currentUrl);
      console.log('Hash:', window.location.hash);
      console.log('Path:', window.location.pathname);

      const params = {
        error: url.searchParams.get('error'),
        error_description: url.searchParams.get('error_description'),
        type,
        hasAccessToken: !!url.searchParams.get('access_token'),
        hasRefreshToken: !!url.searchParams.get('refresh_token'),
        fullUrl: currentUrl,
      };
      
      console.log('Email confirmation params:', params);

      // Clear any existing session first
      await supabase.auth.signOut();

      if (params.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: params.error_description || "An error occurred during email confirmation.",
        });
        navigate('/login');
        return;
      }

      if (type === 'recovery' && code) {
        console.log('Recovery callback detected, storing code');
        // Store the recovery code in session storage with the correct key
        sessionStorage.setItem('recovery_code', code);
        // Navigate to reset password page with the full URL
        navigate('/reset-password', { replace: true });
        return;
      }

      if (type === 'signup' || type === 'magiclink') {
        if (code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            
            toast({
              title: "Success",
              description: "Your email has been confirmed.",
            });
            navigate('/');
          } catch (error: any) {
            console.error('Error exchanging code for session:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message || "Failed to verify email.",
            });
            navigate('/login');
          }
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  return null;
};

export default EmailConfirmationHandler;