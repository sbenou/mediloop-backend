import { useState } from "react";
import { LoginFields } from "./login/LoginFields";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for the toast to show
      onSuccess(); // Call the success callback to trigger navigation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LoginFields
        email={email}
        onEmailChange={setEmail}
        isLoading={isLoading}
      />
    </form>
  );
};