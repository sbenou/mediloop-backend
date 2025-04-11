
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [rememberMe, setRememberMe] = useState(false);
  const { isLoading, handleLogin } = usePasswordLogin({
    email,
    onSuccess, // Pass the onSuccess callback directly
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[PasswordFields] Login form submitted');
    await handleLogin(password, rememberMe);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-start block">Password</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      
      <div className="flex items-center justify-between">
        <RememberMeOption 
          checked={rememberMe} 
          onChange={checked => setRememberMe(checked)}
        />
        <button
          type="button"
          className="text-primary text-sm hover:underline"
          onClick={onForgotPassword}
        >
          Forgot password?
        </button>
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};
