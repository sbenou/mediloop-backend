
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { createUserTenant } from "@/utils/tenancy";
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
      
      console.log(`Starting signup process for ${email} with role ${role}`);
      
      // First check if the user is already signed in (from a previous session)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log("User already has an active session - signing out first");
        await supabase.auth.signOut();
      }
      
      // Check if user already exists in profiles
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing profile:", checkError);
      }

      if (existingProfile) {
        console.log("User already exists, attempting sign in");
        
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.error("Sign in error:", signInError);
            toast({
              title: "Account already exists",
              description: "The email is already registered, but the password is incorrect.",
              variant: "destructive",
            });
            return;
          }
          
          if (signInData.user) {
            console.log("Signed in successfully with existing account");
            
            toast({
              title: "Signed in",
              description: "Successfully signed in with your existing account",
            });
            
            if ((role === 'pharmacist' || role === 'doctor') && onRegistrationComplete) {
              onRegistrationComplete(signInData.user.id, role);
            } else {
              navigate("/");
            }
            return;
          }
        } catch (signInError) {
          console.error("Error during sign in:", signInError);
        }
      }
      
      // Proceed with normal signup
      console.log("Starting Supabase Auth signup process");
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role,
              license_number: licenseNumber || null
            },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        
        if (error) {
          console.error("Signup error:", error);
          
          // Special handling for "User already registered" error
          if (error.message && error.message.includes("already registered")) {
            toast({
              title: "Account already exists",
              description: "Please try signing in instead, or use a different email address.",
              variant: "destructive",
            });
            return;
          }
          
          throw error;
        }
        
        if (!data.user) {
          throw new Error("Failed to create user account");
        }
        
        const userId = data.user.id;
        console.log("Signup successful, user ID:", userId);
        
        // Create profile using RPC function
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
        
        // Create tenant for the user (for patients, create immediately)
        if (role === 'patient') {
          console.log("Creating tenant for patient");
          const tenantId = await createUserTenant(userId, role, name);
          if (!tenantId) {
            console.warn("Failed to create tenant for patient, but continuing with signup");
          }
        }
        
        // Check if email confirmation is required
        const isEmailConfirmationSent = !data.session;
        
        if (isEmailConfirmationSent) {
          console.log("Email confirmation required");
          toast({
            title: "Account created",
            description: "Please check your email for a verification link to complete signup.",
            duration: 6000,
          });
          
          // In development, allow continuing without email verification
          if (process.env.NODE_ENV === 'development') {
            console.log("Development environment: Allowing login without email verification");
            
            // Wait a moment to let the profile be created
            setTimeout(async () => {
              try {
                // Sign in directly without verification in development mode
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email,
                  password
                });
                
                if (signInError) {
                  console.error("Development sign in error:", signInError);
                  return;
                }
                
                if (signInData.user) {
                  console.log("Development: signed in without email verification");
                  
                  toast({
                    title: "Development Mode",
                    description: "Signed in without email verification (development only).",
                    duration: 4000,
                  });
                  
                  if ((role === 'pharmacist' || role === 'doctor') && onRegistrationComplete) {
                    onRegistrationComplete(signInData.user.id, role);
                  } else {
                    navigate("/");
                  }
                }
              } catch (devSignInError) {
                console.error("Development sign in attempt failed:", devSignInError);
              }
            }, 1500);
          }
        } else {
          console.log("User session created immediately");
          
          toast({
            title: "Account created",
            description: "Your account has been created successfully",
          });
          
          if ((role === 'pharmacist' || role === 'doctor') && onRegistrationComplete) {
            onRegistrationComplete(userId, role);
          } else {
            navigate("/");
          }
        }
      } catch (error: any) {
        console.error("Signup process error:", error);
        
        // If error is related to email sending (common in development)
        if (error.message && (
            error.message.includes("sending confirmation email") || 
            error.message.includes("Error sending")
        )) {
          console.log("Email sending error detected - handling specially in development");
          
          if (process.env.NODE_ENV === 'development') {
            // In development, use the "admin" RPC function to create a profile directly
            // This bypasses email verification but keeps the auth user
            
            try {
              // Create a unique user ID since we can't get one from the failed signup
              const devUserId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              
              // Create profile directly 
              const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: devUserId,
                  role: role,
                  full_name: name,
                  email: email,
                  license_number: licenseNumber || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error("Error creating development profile:", insertError);
                throw insertError;
              }
              
              console.log("Created development profile without email verification");
              
              toast({
                title: "Development Account Created",
                description: "Created an account while bypassing email verification (development only).",
                duration: 4000,
              });
              
              // If this is a pharmacist, call the registration complete callback
              if ((role === 'pharmacist' || role === 'doctor') && onRegistrationComplete) {
                onRegistrationComplete(devUserId, role);
              } else {
                navigate("/");
              }
              
              return;
            } catch (devProfileError) {
              console.error("Development profile creation failed:", devProfileError);
              throw devProfileError;
            }
          } else {
            throw new Error("Unable to send verification email. Please contact support.");
          }
        }
        
        throw error;
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
