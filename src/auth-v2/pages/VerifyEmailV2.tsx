import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { persistV2SessionFromBackendLogin } from "@/lib/auth/v2SessionStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const VerifyEmailV2 = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const token = params.get("token");
        const errorParam = params.get("error");
        const errorCode = params.get("error_code");
        const errorDescription = params.get("error_description");

        if (errorParam || errorCode || errorDescription) {
          let errorMessage = "There was a problem verifying your email.";
          if (errorDescription) {
            errorMessage = errorDescription
              .replace(/\+/g, " ")
              .replace(/^./, (str) => str.toUpperCase());
          }
          if (errorCode === "otp_expired") {
            errorMessage =
              "This verification link has expired or already been used. If needed, you can request a new verification email.";
          }
          setError(errorMessage);
          setIsProcessing(false);
          return;
        }

        // New backend flow: /verify-email?token=<uuid>
        if (token) {
          const response = await fetch(
            `${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
            { method: "GET" },
          );
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
            error_code?: string;
            message?: string;
            access_token?: string;
            user?: { id?: string };
            email?: string | null;
          };

          if (!response.ok || !data.access_token || !data.user?.id) {
            if (data.email) {
              setResendEmail(data.email);
            }
            setError(data.error || "Failed to verify email");
            setIsProcessing(false);
            return;
          }

          localStorage.setItem("auth_token", data.access_token);
          localStorage.setItem(
            "mediloop_session_sync",
            JSON.stringify({
              accessToken: data.access_token,
              refreshToken: data.access_token,
              userId: data.user.id,
              timestamp: Date.now(),
            }),
          );
          persistV2SessionFromBackendLogin({
            accessToken: data.access_token,
            refreshToken: data.access_token,
            userId: data.user.id,
          });

          toast({
            title: "Email Confirmed",
            description: data.message || "Your email has been confirmed.",
          });
          navigate("/dashboard");
          return;
        }

        // Legacy query format compatibility
        if (!code) {
          setError("No confirmation code or token found in URL");
          setIsProcessing(false);
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: "signup",
        });

        if (verifyError) {
          setError(verifyError.message || "Failed to verify email");
          setIsProcessing(false);
          return;
        }

        toast({
          title: "Email Confirmed",
          description: "Your email has been confirmed. You can now log in.",
        });
        navigate("/login");
      } catch (err) {
        console.error("Email confirmation error:", err);
        setError("An unexpected error occurred during verification");
        setIsProcessing(false);
      }
    };

    void handleEmailConfirmation();
  }, [navigate]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    const email = resendEmail.trim();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to resend verification.",
      });
      return;
    }
    if (isResending || cooldownSeconds > 0) return;

    setIsResending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        if ((data.error || "").toLowerCase().includes("already verified")) {
          setAlreadyVerified(true);
          setError(null);
          toast({
            title: "Already verified",
            description:
              "This email address is already verified. You can continue to login.",
          });
          return;
        }
        throw new Error(data.error || "Failed to resend verification email");
      }

      setResendSent(true);
      setCooldownSeconds(60);
      toast({
        title: "Verification email sent",
        description:
          "If an account exists and is unverified, we sent a new link.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend verification email";
      toast({
        variant: "destructive",
        title: "Resend failed",
        description: message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleRetry = () => window.location.reload();
  const handleGoToLogin = () => navigate("/login");

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Email Verification (V2)</CardTitle>
          <CardDescription>
            {isProcessing
              ? "We are verifying your email address..."
              : error
                ? "There was a problem verifying your email"
                : "Your email has been verified successfully!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 pt-4">
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : error ? (
            <>
              <p className="text-destructive">{error}</p>
              <div className="w-full max-w-sm space-y-2">
                <label
                  htmlFor="resend-email"
                  className="block text-left text-sm font-medium"
                >
                  Resend verification link
                </label>
                <input
                  id="resend-email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                />
                <Button
                  className="w-full"
                  onClick={handleResend}
                  disabled={isResending || cooldownSeconds > 0}
                >
                  {isResending
                    ? "Sending..."
                    : cooldownSeconds > 0
                      ? `Resend in ${cooldownSeconds}s`
                      : "Resend verification email"}
                </Button>
                {resendSent && (
                  <p className="text-left text-xs text-muted-foreground">
                    If an account exists and is unverified, we sent a new link.
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button onClick={handleGoToLogin}>Go to Login</Button>
              </div>
            </>
          ) : alreadyVerified ? (
            <>
              <p>Your email address is already verified.</p>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button onClick={handleGoToLogin}>Go to Login</Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGoToLogin}>Continue to Login</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailV2;
