import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
        // Store recovery data in sessionStorage
        sessionStorage.setItem('recovery_data', JSON.stringify({
          code,
          timestamp: Date.now()
        }));
        
        // Redirect to reset password page
        navigate('/reset-password');
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