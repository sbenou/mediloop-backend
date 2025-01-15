import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const EmailConfirmationHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get the URL parameters
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const code = params.get('code');

      if (!code) return;

      console.log('Email confirmation type:', type);

      if (type === 'recovery') {
        try {
          // Verify the recovery token is still valid
          const { error } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'recovery'
          });

          if (error) {
            console.error('Password reset verification error:', error);
            toast({
              variant: "destructive",
              title: "Link Expired",
              description: "The password reset link has expired or is invalid. Please request a new one.",
            });
            navigate('/login');
            return;
          }

          // If valid, store recovery data and redirect
          sessionStorage.setItem('recovery_data', JSON.stringify({
            code,
            timestamp: Date.now()
          }));
          
          navigate('/reset-password');
        } catch (error) {
          console.error('Error handling recovery:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "An error occurred while processing your request. Please try again.",
          });
          navigate('/login');
        }
      } else if (type === 'signup') {
        toast({
          title: "Email Confirmed",
          description: "Your email has been confirmed. You can now log in.",
        });
        navigate('/login');
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  return null;
};

export default EmailConfirmationHandler;