
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Eye, EyeOff, AlertCircle } from "lucide-react";
import { usePasswordLoginV2 } from "../hooks/usePasswordLoginV2";

interface PasswordFieldsV2Props {
  email: string;
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const PasswordFieldsV2 = ({ email, onSuccess, onForgotPassword }: PasswordFieldsV2Props) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, login } = usePasswordLoginV2();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PasswordFieldsV2] Attempting login with:', email);
    const result = await login(email, password);
    if (result.success) {
      onSuccess();
    }
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

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

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

      {/* Debug info */}
      <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
        <p>Debug info:</p>
        <p>Email: {email}</p>
        <p>System: V2 JWT Authentication</p>
        <p>Note: You need an existing account to log in. If you don't have one, please sign up first using the legacy system.</p>
      </div>
    </form>
  );
};
