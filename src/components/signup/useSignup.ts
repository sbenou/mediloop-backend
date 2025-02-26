
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "./SignupForm";
import { AuthService } from "@/services/auth";

const RATE_LIMIT_KEY = "signup_rate_limit";
const DEV_USERS_KEY = "dev_mock_users";

// Development-only function to store mock users
const storeMockUser = (email: string, password: string, userId: string, role: string) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    const storedUsers = localStorage.getItem(DEV_USERS_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    users[email] = { password, userId, role };
    localStorage.setItem(DEV_USERS_KEY, JSON.stringify(users));
    console.log(`Development mode: Stored mock user ${email} with ID ${userId}`);
  } catch (e) {
    console.error("Error storing mock user:", e);
  }
};

// Development-only function to retrieve mock users
const getMockUser = (email: string, password: string) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  try {
    const storedUsers = localStorage.getItem(DEV_USERS_KEY);
    if (!storedUsers) return null;
    
    const users = JSON.parse(storedUsers);
    const user = users[email];
    
    if (user && user.password === password) {
      console.log(`Development mode: Retrieved mock user ${email}`);
      return user;
    }
    return null;
  } catch (e) {
    console.error("Error retrieving mock user:", e);
    return null;
  }
};

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

      // DEVELOPMENT MODE ONLY: Check for mock user
      if (process.env.NODE_ENV === 'development') {
        const mockUser = getMockUser(email, password);
        
        if (mockUser) {
          console.log("Development mode: Using existing mock user", mockUser);
          
          toast({
            title: "Development Mode",
            description: "Signed in with mock user in development mode.",
            duration: 3000,
          });
          
          // If this is a pharmacist and we have onRegistrationComplete callback,
          // call it rather than navigating
          if (mockUser.role === 'pharmacist' && onRegistrationComplete) {
            onRegistrationComplete(mockUser.userId, mockUser.role);
          } else {
            navigate("/");
          }
          
          return;
        }
      }

      // Check if user already exists in profiles
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing profile:", checkError);
        // Continue with signup flow, don't throw here
      }

      if (existingUsers) {
        // Try to sign in instead since the profile exists
        try {
          console.log("Profile exists, attempting sign in");
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (!signInError && signInData.user) {
            console.log("Sign in successful with existing credentials");
            
            toast({
              title: "Sign in successful",
              description: "Signed in with existing account.",
              duration: 3000,
            });
            
            // If this is a pharmacist and we have onRegistrationComplete callback,
            // call it rather than navigating
            if (role === 'pharmacist' && onRegistrationComplete) {
              onRegistrationComplete(signInData.user.id, role);
            } else {
              navigate("/");
            }
            
            return;
          } else {
            // Sign in failed, but profile exists
            toast({
              title: "Account already exists",
              description: "An account with this email already exists but the password is incorrect",
              variant: "destructive",
            });
            return;
          }
        } catch (signInError) {
          console.error("Error during sign in:", signInError);
          // Continue with new account creation
        }
      }

      // Try to sign up or sign in
      let userId: string | null = null;
      let userData = null;
      
      // DEVELOPMENT MODE ONLY: Create mock user if we're in development
      if (process.env.NODE_ENV === 'development') {
        // Generate a mock user ID for development purposes
        userId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        console.log("Development mode: Created mock user ID:", userId);
        
        // Store mock user for future sign-ins
        storeMockUser(email, password, userId, role);
        
        toast({
          title: "Development Mode",
          description: "Created mock user for development. Email verification bypassed.",
          duration: 4000,
        });
      } else {
        // PRODUCTION MODE: Proceed with normal signup
        try {
          console.log("Production mode: Proceeding with normal signup flow");
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
                role: role,
              },
              emailRedirectTo: `${window.location.origin}/auth/confirm`,
            },
          });
          
          if (error) {
            throw error;
          }
          
          // Normal signup was successful
          userData = data;
          userId = data.user?.id || null;
          
          if (!userId) {
            throw new Error("Failed to create user account");
          }
        } catch (signupError: any) {
          console.error("Signup error:", signupError);
          throw signupError;
        }
      }

      // Only proceed if we have a valid user ID
      if (userId) {
        console.log("User ID obtained:", userId);

        try {
          // In development mode with mock user ID, create a profile
          if (userId.startsWith('dev-') && process.env.NODE_ENV === 'development') {
            console.log("Creating mock profile for development user");
            
            // Create a mock profile directly in the profiles table
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                role: role,
                full_name: name,
                email: email,
                license_number: licenseNumber || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.error("Error creating mock profile:", insertError);
              // Continue anyway for development mode
            }
          } else {
            // In production, call the RPC function to create the profile
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
      
      // In development mode, for email confirmation errors, try the mock user approach
      if (process.env.NODE_ENV === 'development' && 
          error instanceof Error && 
          (error.message.includes("email") || error.message.includes("confirmation"))) {
        
        console.log("Development mode: Handling email error with mock user approach");
        
        // Generate a mock user ID
        const mockUserId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        // Store mock user
        storeMockUser(email, password, mockUserId, role);
        
        // Create a mock profile
        try {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: mockUserId,
              role: role,
              full_name: name,
              email: email,
              license_number: licenseNumber || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (!insertError) {
            toast({
              title: "Development Mode Fallback",
              description: "Created mock user as a fallback due to email issues.",
              duration: 4000,
            });
            
            // If this is a pharmacist and we have onRegistrationComplete callback,
            // call it rather than navigating
            if (role === 'pharmacist' && onRegistrationComplete) {
              onRegistrationComplete(mockUserId, role);
            } else {
              navigate("/");
            }
            
            // Exit without showing error
            return;
          }
        } catch (mockError) {
          console.error("Error creating mock profile as fallback:", mockError);
          // Continue to show original error
        }
      }
      
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
