
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const PasswordChange = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpUser, setIsOtpUser] = useState(false);

  useEffect(() => {
    const checkAuthMethod = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('auth_method')
        .eq('id', user.id)
        .single();

      setIsOtpUser(profile?.auth_method === 'otp');
    };

    checkAuthMethod();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please ensure your new password and confirmation match.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Update auth method to password
      const { error: updateError } = await supabase.rpc('update_auth_method', {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        method: 'password'
      });

      if (updateError) console.error('Error updating auth method:', updateError);

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {isOtpUser && (
        <Alert>
          <AlertDescription>
            You're currently using one-time codes to log in. Set a password below to enable password-based login.
          </AlertDescription>
        </Alert>
      )}

      {!isOtpUser && (
        <div className="space-y-2 text-left">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required={!isOtpUser}
          />
        </div>
      )}

      <div className="space-y-2 text-left">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-start">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : isOtpUser ? "Set Password" : "Update Password"}
        </Button>
      </div>
    </form>
  );
};

export default PasswordChange;
