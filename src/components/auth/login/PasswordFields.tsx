
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { usePasswordLogin } from "@/hooks/auth/usePasswordLogin";
import { PasswordInput } from "./PasswordInput";
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
  const { isLoading, handleLogin } = usePasswordLogin({
    email,
    onSuccess, // Pass the onSuccess callback directly
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PasswordFields] Login form submitted');
    handleLogin(password, rememberMe);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordInput 
        value={password}
        onChange={setPassword}
        disabled={isLoading}
      />
      
      <div className="flex items-center justify-between">
        <RememberMeOption 
          checked={rememberMe} 
          onChange={checked => setRememberMe(checked)}
          disabled={isLoading}
        />
        <button
          type="button"
          className="text-primary text-sm hover:underline"
          onClick={onForgotPassword}
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>
      
      <LoginButton isLoading={isLoading} />
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
      "Login"
    )}
  </Button>
);
