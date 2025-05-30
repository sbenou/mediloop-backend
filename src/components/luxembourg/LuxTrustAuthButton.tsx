
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Shield, CheckCircle } from 'lucide-react';
import { useLuxTrustAuth } from '@/hooks/useLuxTrustAuth';

interface LuxTrustAuthButtonProps {
  onSuccess?: (response: any) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const LuxTrustAuthButton: React.FC<LuxTrustAuthButtonProps> = ({ 
  onSuccess,
  variant = 'default',
  size = 'md'
}) => {
  const { authenticateWithLuxTrust, isAuthenticating, isAuthenticated } = useLuxTrustAuth();

  const handleAuth = async () => {
    const response = await authenticateWithLuxTrust();
    if (response?.success && onSuccess) {
      onSuccess(response);
    }
  };

  if (isAuthenticated) {
    return (
      <Button variant="outline" disabled className="w-full">
        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
        LuxTrust Verified
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAuth}
      disabled={isAuthenticating}
      variant={variant}
      size={size}
      className="w-full"
    >
      {isAuthenticating ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Authenticating with LuxTrust...
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Authenticate with LuxTrust
        </>
      )}
    </Button>
  );
};

export default LuxTrustAuthButton;
