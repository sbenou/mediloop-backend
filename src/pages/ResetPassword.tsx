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

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for recovery code on mount
  useEffect(() => {
    const recoveryCode = sessionStorage.getItem('recovery_code');
    if (!recoveryCode) {
      toast({
        variant: "destructive",
        title: "Invalid Access",
        description: "Please use the reset password link from your email.",
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Clear the recovery code
      sessionStorage.removeItem('recovery_code');

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