import { useState } from "react";
import { LoginFields } from "./login/LoginFields";
import { OTPVerificationForm } from "./login/OTPVerificationForm";
import { AuthOptions } from "./login/AuthOptions";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSent = () => {
    console.log('Email sent, showing auth options');
    setShowAuthOptions(true);
  };

  const handleSelectOTP = () => {
    console.log('OTP selected, showing OTP form');
    setShowAuthOptions(false);
    setShowOTPForm(true);
  };

  console.log('LoginForm state:', { showAuthOptions, showOTPForm });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!showAuthOptions && !showOTPForm ? (
        <LoginFields
          email={email}
          onEmailChange={setEmail}
          isLoading={isLoading}
          onEmailSent={handleEmailSent}
        />
      ) : showAuthOptions ? (
        <AuthOptions 
          email={email}
          onSelectOTP={handleSelectOTP}
        />
      ) : (
        <OTPVerificationForm 
          email={email}
          onSuccess={onSuccess}
        />
      )}
    </form>
  );
};