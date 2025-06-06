
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader } from "lucide-react";
// For now, we'll use legacy password reset - will be replaced with auth service later
import { usePasswordReset } from "@/hooks/auth/usePasswordReset";

interface AuthOptionsV2Props {
  email: string;
  onBack: () => void;
}

export const AuthOptionsV2 = ({ email, onBack }: AuthOptionsV2Props) => {
  const [resetEmail, setResetEmail] = useState(email);
  const { handlePasswordReset, isSendingReset } = usePasswordReset();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthOptionsV2] Sending reset email to:', resetEmail);
    await handlePasswordReset(resetEmail);
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        className="p-0 h-auto font-normal hover:bg-transparent mb-4"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to password
      </Button>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Reset your password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSendingReset || !resetEmail}
          >
            {isSendingReset ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Sending reset email...
              </>
            ) : (
              "Send reset email"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
