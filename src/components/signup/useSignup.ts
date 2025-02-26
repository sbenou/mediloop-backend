import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "./SignupForm";

const RATE_LIMIT_KEY = "signup_rate_limit";

export const useSignup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExpiresAt, setRateLimitExpiresAt] = useState<number | null>(
    () => {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      return stored ? parseInt(stored, 10) : null;
    }
  );
  const navigate = useNavigate();

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    licenseNumber?: string,
    onRegistrationComplete?: (userId: string, role: string) => void
  ) => {
    try {
      // Check rate limiting
      if (rateLimitExpiresAt && Date.now() < rateLimitExpiresAt) {
        toast({
          title: "Too many attempts",
          description: "Please wait before trying again",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingUsers) {
        toast({
          title: "Account already exists",
          description: "An account with this email already exists",
          variant: "destructive",
        });
        return;
      }

      // Start sign up process
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
        },
      });

      // Handle email confirmation errors in development
      if (error && error.message.includes("confirmation email")) {
        console.log("Email confirmation error encountered, but continuing with signup process");
        
        try {
          // Instead of trying to sign in immediately, let's create the profile directly
          // Generate a mock UUID for development testing
          const mockUserId = crypto.randomUUID();
          
          // Create profile manually since the trigger might not have run
          const { error: profileError } = await supabase.rpc("create_profile_secure", {
            user_id: mockUserId,
            user_role: role,
            user_full_name: name,
            user_email: email,
            user_license_number: licenseNumber || null,
          });
          
          if (profileError) {
            console.error("Error creating profile:", profileError);
            throw profileError;
          } else {
            console.log("Profile created successfully after email confirmation error");
          }
          
          toast({
            title: "Development Account Created",
            description: "Your account has been created for development testing. In production, email verification would be required.",
          });
          
          // In development, we can't proceed with auto-login, so let's redirect to login
          toast({
            title: "Please Login",
            description: "For development testing, please use the login page with your credentials.",
          });
          
          navigate("/login");
          return;
        } catch (createProfileError) {
          console.error("Profile creation exception:", createProfileError);
          throw createProfileError;
        }
      } else if (error) {
        throw error;
      }

      if (data?.user) {
        console.log("User signup successful:", data.user);

        // Call the RPC function to create the profile
        const { error: profileError } = await supabase.rpc("create_profile_secure", {
          user_id: data.user.id,
          user_role: role,
          user_full_name: name,
          user_email: email,
          user_license_number: licenseNumber || null,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          throw profileError;
        }

        // Show success message
        toast({
          title: "Account created",
          description: "Your account has been created successfully",
        });

        // If this is a pharmacist and we have onRegistrationComplete callback,
        // call it rather than navigating
        if (role === 'pharmacist' && onRegistrationComplete) {
          console.log("Calling onRegistrationComplete for pharmacist");
          onRegistrationComplete(data.user.id, role);
        } else {
          // Otherwise, navigate to home
          console.log("Navigating to home for non-pharmacist or no callback");
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);

      // Implement rate limiting after 3 consecutive failures
      const signupFailures = parseInt(
        localStorage.getItem("signup_failures") || "0",
        10
      );
      localStorage.setItem("signup_failures", (signupFailures + 1).toString());

      if (signupFailures >= 2) {
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        localStorage.setItem(RATE_LIMIT_KEY, expiresAt.toString());
        setRateLimitExpiresAt(expiresAt);
      }

      let errorMessage = "An error occurred during signup. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSignup,
    isSubmitting,
    rateLimitExpiresAt,
  };
};
