
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "./SignupForm";
import { AuthService } from "@/services/auth";

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

      // Check if user already exists
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

      // Try to sign up
      let userId: string | null = null;
      let userData = null;
      
      try {
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
        
        if (error) {
          // Handle specific error cases
          if (error.message.includes("rate limit") || error.code === 'over_email_send_rate_limit') {
            throw new Error("Email rate limit exceeded. Please try again later.");
          }
          if (error.message.includes("sending confirmation email")) {
            // This is a common error in development environments
            throw new Error("Error sending confirmation email. This is usually a temporary issue.");
          }
          throw error;
        }
        
        // Store user data if signup is successful
        userData = data;
        userId = data.user?.id || null;
      } catch (signupError: any) {
        // Special case for development to avoid common issues
        if (process.env.NODE_ENV === 'development' && 
            (signupError.message.includes("rate limit") || 
             signupError.message.includes("confirmation email") || 
             signupError.message.includes("email confirmation"))) {
          
          console.log("Development mode: Email-related error bypassed:", signupError.message);
          
          // For development, offer a better user experience by showing a helpful message
          if (signupError.message.includes("confirmation email")) {
            toast({
              title: "Development Environment",
              description: "The system cannot send confirmation emails in this environment. Please try the login flow using the same credentials.",
              duration: 6000,
            });
          }
          
          // Try to sign in with provided credentials to check if user exists
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (!error && data.user) {
            // User exists and credentials are valid
            userId = data.user.id;
            userData = data;
            console.log("Found existing user, proceeding with profile creation");
          } else {
            // In development, but can't sign in (user probably doesn't exist yet)
            // For development only: Generate a random UUID only for demonstration purposes
            if (process.env.NODE_ENV === 'development' && signupError.message.includes("confirmation email")) {
              // Show a clear warning toast
              toast({
                title: "Development only",
                description: "Please use an existing account. In production, verification emails would be sent properly.",
                variant: "destructive",
                duration: 6000,
              });
              
              console.log("Cannot proceed with signup due to email confirmation issues");
              return; // Don't proceed further - this prevents foreign key constraint errors
            }
            
            // For any other error, show the error
            throw signupError;
          }
        } else {
          // For any other error or in production, throw the original error
          throw signupError;
        }
      }

      // Only proceed if we have a valid user ID
      if (userId) {
        console.log("User signup successful:", userId);

        try {
          // First check if profile already exists
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", userId)
            .maybeSingle();
            
          if (existingProfile) {
            console.log("Profile already exists for user:", userId);
            
            // Update the existing profile with the new data
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                role: role,
                full_name: name,
                email: email,
                license_number: licenseNumber || null,
                updated_at: new Date().toISOString() // Fix: Convert Date to ISO string
              })
              .eq("id", userId);
              
            if (updateError) {
              console.error("Error updating profile:", updateError);
              throw updateError;
            }
          } else {
            // Call the RPC function to create the profile
            const { error: profileError } = await supabase.rpc("create_profile_secure", {
              user_id: userId,
              user_role: role,
              user_full_name: name,
              user_email: email,
              user_license_number: licenseNumber || null,
            });

            if (profileError) {
              console.error("Error creating profile:", profileError);
              throw profileError;
            }
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
            onRegistrationComplete(userId, role);
          } else {
            // Otherwise, navigate to home
            console.log("Navigating to home for non-pharmacist or no callback");
            navigate("/");
          }
        } catch (profileError) {
          console.error("Profile creation error:", profileError);
          throw profileError;
        }
      } else {
        // No valid user ID was obtained
        throw new Error("Failed to create or find user account");
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
