
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { usePasswordLogin } from "@/hooks/auth/usePasswordLogin";

interface PasswordFieldsProps {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFields = ({ email, onSuccess, onForgotPassword }: PasswordFieldsProps) => {
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX
  const { handleLogin, isLoading } = usePasswordLogin({ email, onSuccess });

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
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="rememberMe" 
          checked={rememberMe} 
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Remember me
        </Label>
      </div>
      
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
      <Button
        type="button"
        variant="link"
        className="w-full"
        onClick={onForgotPassword}
        disabled={isLoading}
      >
        Forgot your password?
      </Button>
    </form>
  );
};
