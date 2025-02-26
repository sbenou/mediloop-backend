
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

      // Try to sign up or sign in
      let userId: string | null = null;
      let userData = null;
      
      // For development mode, try to sign in first in case the user already exists
      // This helps bypass email verification issues
      if (process.env.NODE_ENV === 'development') {
        try {
          console.log("Development mode: Attempting sign in first");
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (!signInError && signInData.user) {
            // User exists and credentials are valid
            userId = signInData.user.id;
            userData = signInData;
            console.log("Found existing user, proceeding with profile creation");
            
            toast({
              title: "Development Mode",
              description: "Signed in with existing account in development mode.",
              duration: 3000,
            });
          }
        } catch (signInError) {
          console.log("Development sign-in attempt failed (likely new user):", signInError);
          // Continue with signup flow
        }
      }
      
      // If we don't have a user ID yet, proceed with normal signup
      if (!userId) {
        try {
          console.log("Proceeding with normal signup flow");
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
                role: role,
              },
              // In development, let's force email confirmation to be bypassed
              emailRedirectTo: process.env.NODE_ENV === 'development' 
                ? window.location.origin 
                : `${window.location.origin}/auth/confirm`,
            },
          });
          
          if (error) {
            // For development mode, special handling of email errors
            if (process.env.NODE_ENV === 'development' && 
                (error.message.includes("email") || 
                 error.message.includes("confirmation") ||
                 error.message.includes("rate limit") || 
                 error.code === 'over_email_send_rate_limit')) {
              
              console.log("Development mode: Email error detected, using workaround", error.message);
              
              // Generate a development mock ID
              userId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
              
              toast({
                title: "Development Mode",
                description: "Email verification bypassed in development. Using mock user ID.",
                duration: 4000,
              });
            } else {
              // Production or non-email error - throw it
              throw error;
            }
          } else {
            // Normal signup was successful
            userData = data;
            userId = data.user?.id || null;
            
            if (!userId && process.env.NODE_ENV === 'development') {
              console.log("No user ID returned in development mode, using mock ID");
              userId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            }
          }
        } catch (signupError: any) {
          // Special case for development to avoid common issues
          if (process.env.NODE_ENV === 'development' && 
              (signupError.message?.includes("email") || 
              signupError.message?.includes("confirmation"))) {
            
            console.log("Development mode: Email-related error bypassed:", signupError.message);
            
            // Generate a mock user ID for development purposes
            userId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            
            toast({
              title: "Development Mode",
              description: "Email verification bypassed in development. Using mock user ID.",
              duration: 4000,
            });
          } else {
            // For any other error or in production, throw the original error
            throw signupError;
          }
        }
      }

      // Only proceed if we have a valid user ID
      if (userId) {
        console.log("User signup/signin successful:", userId);

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
                updated_at: new Date().toISOString()
              })
              .eq("id", userId);
              
            if (updateError) {
              console.error("Error updating profile:", updateError);
              throw updateError;
            }
          } else {
            if (userId.startsWith('dev-') && process.env.NODE_ENV === 'development') {
              // In development with mock user ID, just show success message
              console.log("Development mode: Skipping profile creation for mock user ID");
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
          }

          // Show success message
          toast({
            title: "Account created",
            description: process.env.NODE_ENV === 'development'
              ? "Your account has been created successfully (dev mode)"
              : "Your account has been created successfully. Please check your email to verify your account.",
          });

          // If this is a pharmacist and we have onRegistrationComplete callback,
          // call it rather than navigating
          if (role === 'pharmacist' && onRegistrationComplete) {
            console.log("Calling onRegistrationComplete for pharmacist");
            onRegistrationComplete(userId, role);
          } else if (process.env.NODE_ENV === 'development' || userId.startsWith('dev-')) {
            // In development, we can navigate directly
            console.log("Development mode: Navigating to home");
            navigate("/");
          } else {
            // In production with email verification, show message but don't navigate
            console.log("Production mode: Waiting for email verification");
            toast({
              title: "Verification Required",
              description: "Please check your email to verify your account before logging in.",
              duration: 6000,
            });
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
      
      // Propagate the error for the form to handle
      throw error;
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
