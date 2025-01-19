import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPVerificationForm } from "@/components/auth/reset-password/OTPVerificationForm";
import { NewPasswordForm } from "@/components/auth/reset-password/NewPasswordForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const isNewPasswordStep = window.location.pathname === "/reset-password/new";

  useEffect(() => {
    if (!email && !isNewPasswordStep) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate, isNewPasswordStep]);

  if (!email && !isNewPasswordStep) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid. Please request a new password reset from the login page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No email address found in the reset link. Please start the password reset process again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {isNewPasswordStep ? "Reset Password" : "Verify Email"}
          </CardTitle>
          <CardDescription>
            {isNewPasswordStep 
              ? "Enter your new password below"
              : "Enter the verification code sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNewPasswordStep 
            ? <NewPasswordForm email={email || ''} />
            : <OTPVerificationForm email={email || ''} />
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;