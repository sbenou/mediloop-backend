import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { LoginForm } from "@/components/auth/LoginForm";
import { UserRole } from "@/components/signup/SignupForm";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedRole = searchParams.get("role") as UserRole | null;

  // Handle email confirmation
  useEffect(() => {
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      toast({
        variant: "destructive",
        title: "Error",
        description: errorDescription,
      });
      return;
    }

    // Check if this is a redirect from email verification
    const access_token = searchParams.get("access_token");
    const refresh_token = searchParams.get("refresh_token");
    const type = searchParams.get("type");

    if (type === "signup" && access_token && refresh_token) {
      // Set the session
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).then(({ data, error }) => {
        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "There was an error confirming your email. Please try logging in.",
          });
        } else if (data?.session) {
          toast({
            title: "Success",
            description: "Your email has been confirmed. You are now logged in.",
          });
          navigate("/");
        }
      });
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password to login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={() => navigate("/")} selectedRole={selectedRole} />
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              to={selectedRole ? `/signup?role=${selectedRole}` : "/signup"} 
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;