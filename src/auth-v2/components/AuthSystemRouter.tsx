
import React from 'react';
import { useAuthToggle } from '../hooks/useAuthToggle';

// Legacy imports
import LegacyLogin from '../../pages/Login';
import LegacySignup from '../../pages/Signup';

// New auth imports (will be created)
import LoginV2 from '../pages/LoginV2';
import SignupV2 from '../pages/SignupV2';

interface AuthSystemRouterProps {
  type: 'login' | 'signup';
}

const AuthSystemRouter: React.FC<AuthSystemRouterProps> = ({ type }) => {
  const { useNewAuthService } = useAuthToggle();

  console.log(`AuthSystemRouter: Using ${useNewAuthService ? 'new' : 'legacy'} auth system for ${type}`);

  if (useNewAuthService) {
    return type === 'login' ? <LoginV2 /> : <SignupV2 />;
  }

  return type === 'login' ? <LegacyLogin /> : <LegacySignup />;
};

export default AuthSystemRouter;
