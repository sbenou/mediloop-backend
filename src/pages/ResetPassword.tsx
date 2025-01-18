import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPVerificationForm } from "@/components/auth/reset-password/OTPVerificationForm";
import { NewPasswordForm } from "@/components/auth/reset-password/NewPasswordForm";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const isNewPasswordStep = window.location.pathname === "/reset-password/new";

  if (!email) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid. Please request a new password reset from the login page.
            </CardDescription>
          </CardHeader>
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
            ? <NewPasswordForm email={email} />
            : <OTPVerificationForm email={email} />
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;