
import { useState, useEffect } from "react";
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

// Development-mode only: Create a user directly in the profiles table
const createDevModeUser = async (
  email: string, 
  password: string, 
  name: string, 
  role: UserRole,
  licenseNumber: string | undefined,
  onRegistrationComplete?: (userId: string, role: string) => void,
  navigate?: (to: string) => void
) => {
  // Generate a mock user ID
  const mockUserId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  console.log("Development mode: Creating mock user with ID:", mockUserId);
  
  // Store mock user for future sign-ins
  storeMockUser(email, password, mockUserId, role);
  
  // Create a mock profile directly in the profiles table
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
      
    if (insertError) {
      console.error("Error creating mock profile:", insertError);
      return { success: false, error: insertError };
    }
    
    toast({
      title: "Development Mode",
      description: "Created mock user for development. Email verification bypassed.",
      duration: 4000,
    });
    
    // If this is a pharmacist and we have onRegistrationComplete callback,
    // call it rather than navigating
    if (role === 'pharmacist' && onRegistrationComplete) {
      onRegistrationComplete(mockUserId, role);
    } else if (navigate) {
      navigate("/");
    }
    
    return { success: true, userId: mockUserId };
  } catch (error) {
    console.error("Error in createDevModeUser:", error);
    return { success: false, error };
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
  const [isDevelopment, setIsDevelopment] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // More reliable environment detection
    setIsDevelopment(process.env.NODE_ENV === 'development');
    console.log("Current environment check:", process.env.NODE_ENV, "isDevelopment:", process.env.NODE_ENV === 'development');
  }, []);

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
      
      // Force-check environment again for reliability
      const isDevMode = process.env.NODE_ENV === 'development';
      console.log(`Signup attempt for ${email} with role ${role} in ${isDevMode ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

      // DEVELOPMENT MODE: Always use mock user system in development
      if (isDevMode) {
        console.log("Development mode CONFIRMED: Using mock user system for signup");
        
        // First check if we already have this user
        const existingMockUser = getMockUser(email, password);
        
        if (existingMockUser) {
          console.log("Development mode: Using existing mock user", existingMockUser);
          
          toast({
            title: "Development Mode",
            description: "Signed in with existing mock user in development mode.",
            duration: 3000,
          });
          
          // If this is a pharmacist and we have onRegistrationComplete callback,
          // call it rather than navigating
          if (existingMockUser.role === 'pharmacist' && onRegistrationComplete) {
            onRegistrationComplete(existingMockUser.userId, existingMockUser.role);
          } else {
            navigate("/");
          }
          
          return;
        }
        
        // No existing user, create a new one
        console.log("Development mode: Creating new mock user");
        const result = await createDevModeUser(
          email, 
          password, 
          name, 
          role, 
          licenseNumber, 
          onRegistrationComplete,
          navigate
        );
        
        if (result.success) {
          console.log("Development mode: Successfully created mock user");
          return; // Successfully created dev mode user
        }
        
        console.log("Development mode: Failed to create mock user, trying fallback approach");
      } else {
        console.log("Production mode CONFIRMED: Will proceed with normal signup flow");
      }

      // For production or as fallback - check if user already exists in profiles
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing profile:", checkError);
        // Continue with signup flow, don't throw here
      }

      if (existingProfile) {
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

      // DEVELOPMENT MODE - always use the mock user approach in development
      if (isDevMode) {
        console.log("Development mode confirmed again: Using mock user approach");
        // Try creating a dev mode user a final time
        const finalDevResult = await createDevModeUser(
          email, 
          password, 
          name, 
          role, 
          licenseNumber, 
          onRegistrationComplete,
          navigate
        );
        
        if (finalDevResult.success) {
          console.log("Development mode: Successfully created mock user in final attempt");
          return; // Successfully created dev mode user
        }
        
        console.log("Development mode: ALL attempts to create mock user failed");
        throw new Error("Failed to create development mode user after multiple attempts");
      }
      
      // PRODUCTION MODE - attempt normal signup with email verification
      console.log("Production mode: Proceeding with normal signup flow");
      try {
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
        const userId = data.user?.id;
        
        if (!userId) {
          throw new Error("Failed to create user account");
        }
        
        console.log("Production signup successful, user ID:", userId);
        
        // Create profile
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
        
        // Show success message
        toast({
          title: "Account created",
          description: "Your account has been created successfully. Please check your email to verify your account.",
        });
        
        // If this is a pharmacist and we have onRegistrationComplete callback,
        // call it rather than navigating
        if (role === 'pharmacist' && onRegistrationComplete) {
          console.log("Calling onRegistrationComplete for pharmacist");
          onRegistrationComplete(userId, role);
        } else {
          // In production with email verification, show message but don't navigate
          console.log("Production mode: Waiting for email verification");
          toast({
            title: "Verification Required",
            description: "Please check your email to verify your account before logging in.",
            duration: 6000,
          });
        }
      } catch (error) {
        console.error("Production signup error:", error);
        
        // Handle email confirmation errors in development mode as a last resort
        if (isDevMode && error instanceof Error && 
            (error.message.includes("email") || error.message.includes("confirmation"))) {
          
          console.log("Development mode: Handling email error as a last resort");
          const lastResortResult = await createDevModeUser(
            email, 
            password, 
            name, 
            role, 
            licenseNumber, 
            onRegistrationComplete,
            navigate
          );
          
          if (lastResortResult.success) {
            console.log("Development mode: Successfully created mock user as last resort");
            return;
          }
        }
        
        // In production, or if all development fallbacks fail, throw the error
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
      
      // Last chance for email confirmation errors in development mode
      const lastChanceDevMode = process.env.NODE_ENV === 'development';
      if (lastChanceDevMode && 
          error instanceof Error && 
          (error.message.includes("email") || error.message.includes("confirmation"))) {
        
        console.log("Development mode: LAST CHANCE handling for email error");
        
        try {
          // Generate a mock user ID
          const mockUserId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          
          // Store mock user
          storeMockUser(email, password, mockUserId, role);
          
          // Create a mock profile
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
              title: "Development Mode Emergency Fallback",
              description: "Created mock user after catching email error.",
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
        } catch (finalError) {
          console.error("Error in last chance development mode fallback:", finalError);
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
