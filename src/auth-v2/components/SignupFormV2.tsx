
import React from 'react';
// For now, we'll duplicate the legacy SignupForm and just rename it
import { SignupForm } from '@/components/signup/SignupForm';

interface SignupFormV2Props {
  onRegistrationComplete: (userId: string, role: string) => void;
}

export const SignupFormV2: React.FC<SignupFormV2Props> = ({ onRegistrationComplete }) => {
  // For now, this is identical to legacy - will be enhanced to use auth service later
  return <SignupForm onRegistrationComplete={onRegistrationComplete} />;
};
