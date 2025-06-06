
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Eye, EyeOff } from "lucide-react";
// For now, we'll use legacy password login - will be replaced with auth service later
import { usePasswordLogin } from "@/hooks/auth/usePasswordLogin";

interface PasswordFieldsV2Props {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFieldsV2 = ({ email, onSuccess, onForgotPassword }: PasswordFieldsV2Props) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, handleLogin } = usePasswordLogin({ email, onSuccess });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PasswordFieldsV2] Attempting login with:', email);
    await handleLogin(password, true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !password}
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

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          className="text-sm text-muted-foreground hover:text-primary"
          onClick={onForgotPassword}
        >
          Forgot your password?
        </Button>
      </div>
    </form>
  );
};
