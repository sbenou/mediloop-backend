
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
            console.log("Email confirmation error detected in development mode");
            
            if (process.env.NODE_ENV === 'development') {
              // In development mode, provide a helpful message but don't throw
              toast({
                title: "Development Environment",
                description: "Email confirmation bypassed in development mode.",
                duration: 4000,
              });
              
              // Try to sign in instead to check if account exists
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (!signInError && signInData.user) {
                // User exists and credentials are valid
                userId = signInData.user.id;
                userData = signInData;
                console.log("Found existing user, proceeding with profile creation");
              } else {
                // Generate a mock user ID for development purposes
                console.log("Creating mock user ID for development");
                userId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                
                toast({
                  title: "Development Only",
                  description: "Using mock user ID for development. In production, verification emails would be sent properly.",
                  duration: 6000,
                });
              }
            } else {
              // In production, this is a real error
              throw new Error("Error sending confirmation email. This is usually a temporary issue.");
            }
          } else {
            throw error;
          }
        } else {
          // Store user data if signup is successful
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
            (signupError.message.includes("rate limit") || 
             signupError.message.includes("confirmation email") || 
             signupError.message.includes("email confirmation"))) {
          
          console.log("Development mode: Email-related error bypassed:", signupError.message);
          
          // For development, offer a better user experience by showing a helpful message
          toast({
            title: "Development Environment",
            description: "Email confirmation bypassed in development mode.",
            duration: 4000,
          });
          
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
            // Generate a mock user ID for development purposes
            userId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            
            toast({
              title: "Development Only",
              description: "Using mock user ID for development. In production, verification emails would be sent properly.",
              duration: 6000,
            });
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
