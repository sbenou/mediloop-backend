
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { usePasswordLogin } from "@/hooks/auth/usePasswordLogin";
import { RememberMeOption } from "./RememberMeOption";

interface PasswordFieldsProps {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFields = ({ 
  email, 
  onSuccess, 
  onForgotPassword 
}: PasswordFieldsProps) => {
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX
  const { handleLogin, isLoading } = usePasswordLogin({ 
    email, 
    onSuccess 
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(password, rememberMe);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-start">
      <PasswordInput 
        value={password}
        onChange={setPassword}
        disabled={isLoading}
      />
      
      <RememberMeOption 
        checked={rememberMe}
        onChange={setRememberMe}
        disabled={isLoading}
      />
      
      <LoginButton isLoading={isLoading} />
      
      <ForgotPasswordButton 
        onClick={onForgotPassword} 
        disabled={isLoading} 
      />
    </form>
  );
};

interface LoginButtonProps {
  isLoading: boolean;
}

const LoginButton = ({ isLoading }: LoginButtonProps) => (
  <Button
    type="submit"
    className="w-full"
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <Loader className="mr-2 h-4 w-4 animate-spin" />
        Signing in...
      </>
    ) : (
      "Sign in"
    )}
  </Button>
);

interface ForgotPasswordButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const ForgotPasswordButton = ({ onClick, disabled }: ForgotPasswordButtonProps) => (
  <Button
    type="button"
    variant="link"
    className="w-full"
    onClick={onClick}
    disabled={disabled}
  >
    Forgot your password?
  </Button>
);
