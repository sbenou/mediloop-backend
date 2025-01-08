import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const RECOVERY_CODE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for recovery code on mount
  useEffect(() => {
    const recoveryDataStr = sessionStorage.getItem('recovery_data');
    if (!recoveryDataStr) {
      toast({
        variant: "destructive",
        title: "Invalid Access",
        description: "Please use the reset password link from your email.",
      });
      navigate('/login');
      return;
    }

    const recoveryData = JSON.parse(recoveryDataStr);
    const isExpired = Date.now() - recoveryData.timestamp > RECOVERY_CODE_EXPIRY;
    
    if (isExpired) {
      sessionStorage.removeItem('recovery_data');
      toast({
        variant: "destructive",
        title: "Link Expired",
        description: "The password reset link has expired. Please request a new one.",
      });
      navigate('/login');
    }
  }, [navigate, toast]);

  // Check password match whenever either password changes
  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both passwords are identical.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the recovery data from session storage
      const recoveryDataStr = sessionStorage.getItem('recovery_data');
      if (!recoveryDataStr) {
        throw new Error('Recovery code not found');
      }

      const recoveryData = JSON.parse(recoveryDataStr);
      const { code } = recoveryData;

      // First verify the recovery code with the correct type parameters
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: code,
        type: 'recovery'
      });

      if (verifyError) {
        console.error('Password reset error:', verifyError);
        throw verifyError;
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Clear the recovery data
      sessionStorage.removeItem('recovery_data');

      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in with your new password.",
        duration: 5000,
      });
      
      // Sign out any existing session
      await supabase.auth.signOut();
      
      // Redirect to login
      navigate("/login");
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
      });
      
      if (error.message.includes('expired')) {
        sessionStorage.removeItem('recovery_data');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;