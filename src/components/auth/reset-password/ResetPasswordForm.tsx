import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X } from "lucide-react";

interface ResetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
  isLoading: boolean;
}

export const ResetPasswordForm = ({ onSubmit, isLoading }: ResetPasswordFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword) {
      await onSubmit(password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="Enter your new password"
            className="pl-8"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            className="pl-8"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {passwordsMatch !== null && (
        <Alert variant={passwordsMatch ? "default" : "destructive"} className="flex items-center gap-2">
          {passwordsMatch ? (
            <>
              <Check className="h-4 w-4" />
              <AlertDescription>Passwords match</AlertDescription>
            </>
          ) : (
            <>
              <X className="h-4 w-4" />
              <AlertDescription>Passwords do not match</AlertDescription>
            </>
          )}
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !passwordsMatch}>
        {isLoading ? "Resetting Password..." : "Reset Password"}
      </Button>
    </form>
  );
};