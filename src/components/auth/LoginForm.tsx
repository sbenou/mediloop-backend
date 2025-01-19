import { useState } from "react";
import { LoginFields } from "./login/LoginFields";
import { PasswordFields } from "./login/PasswordFields";
import { AuthOptions } from "./login/AuthOptions";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);

  const handleEmailSubmit = async () => {
    setShowPasswordField(true);
  };

  const handleForgotPassword = () => {
    setShowResetOptions(true);
    setShowPasswordField(false);
  };

  return (
    <form className="space-y-4">
      {!showPasswordField && !showResetOptions ? (
        <LoginFields
          email={email}
          onEmailChange={setEmail}
          isLoading={isLoading}
          onEmailSubmit={handleEmailSubmit}
        />
      ) : showPasswordField ? (
        <PasswordFields
          email={email}
          onSuccess={onSuccess}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        <AuthOptions 
          email={email}
          onBack={() => {
            setShowResetOptions(false);
            setShowPasswordField(true);
          }}
        />
      )}
    </form>
  );
};