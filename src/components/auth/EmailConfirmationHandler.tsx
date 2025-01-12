import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const code = url.searchParams.get('code');
        const type = url.searchParams.get('type');
        
        console.log('Email confirmation params:', {
          type,
          code: !!code,
          fullUrl: currentUrl
        });

        if (type === 'recovery' && code) {
          console.log('Recovery callback detected, storing code');
          const recoveryData = {
            code,
            timestamp: Date.now()
          };
          sessionStorage.setItem('recovery_data', JSON.stringify(recoveryData));
          navigate('/reset-password', { replace: true });
          return;
        }

        if (type === 'signup' || type === 'magiclink') {
          // Clear any existing session first
          await supabase.auth.signOut();
          
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Error exchanging code for session:', error);
              toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to verify email.",
              });
              navigate('/login');
              return;
            }

            if (data.session) {
              toast({
                title: "Success",
                description: "Your email has been confirmed. You can now log in.",
              });
              navigate('/login');
            }
          }
        }

        // If no specific type or code, redirect to login
        if (!type || !code) {
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error in email confirmation:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred during email confirmation. Please try again.",
        });
        navigate('/login');
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  return null;
};

export default EmailConfirmationHandler;