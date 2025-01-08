import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { LoginFields } from "./login/LoginFields";
import { useLogin } from "@/hooks/auth/useLogin";
import { UserRole } from "../signup/SignupForm";

interface LoginFormProps {
  onSuccess: () => void;
  selectedRole?: UserRole | null;
}

export const LoginForm = ({ onSuccess, selectedRole }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, handleLogin } = useLogin(onSuccess);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LoginFields
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        isLoading={isLoading}
        selectedRole={selectedRole}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        <LogIn className="mr-2 h-4 w-4" />
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};