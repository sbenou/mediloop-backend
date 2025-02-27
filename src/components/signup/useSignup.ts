
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { UserRole } from "./SignupForm";

const RATE_LIMIT_KEY = "signup_rate_limit";
const DEV_USERS_KEY = "dev_mock_users";

// Simple mock user storage for development
const storeMockUser = (email: string, password: string, userId: string, role: string) => {
  try {
    const storedUsers = localStorage.getItem(DEV_USERS_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    users[email] = { password, userId, role };
    localStorage.setItem(DEV_USERS_KEY, JSON.stringify(users));
    console.log(`Stored mock user ${email} with ID ${userId}`);
  } catch (e) {
    console.error("Error storing mock user:", e);
  }
};

// Find an existing mock user
const getMockUser = (email: string, password: string) => {
  try {
    const storedUsers = localStorage.getItem(DEV_USERS_KEY);
    if (!storedUsers) return null;
    
    const users = JSON.parse(storedUsers);
    const user = users[email];
    
    if (user && user.password === password) {
      console.log(`Retrieved mock user ${email}`);
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
      
      console.log(`Starting signup process for ${email} with role ${role}`);
      
      // Check for existing mock user first
      const existingMockUser = getMockUser(email, password);
      
      if (existingMockUser) {
        console.log("Using existing mock user:", existingMockUser);
        
        toast({
          title: "Development Mode",
          description: "Signed in with existing mock account.",
          duration: 3000,
        });
        
        if (existingMockUser.role === 'pharmacist' && onRegistrationComplete) {
          onRegistrationComplete(existingMockUser.userId, existingMockUser.role);
        } else {
          navigate("/");
        }
        
        return;
      }
      
      // Generate a mock user ID for all users in the development environment
      const mockUserId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      console.log("Created mock user ID:", mockUserId);
      
      // Store mock user for future logins
      storeMockUser(email, password, mockUserId, role);
      
      // Create a profile for the mock user
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
          throw insertError;
        }
        
        console.log("Successfully created mock profile");
        
        toast({
          title: "Account Created",
          description: "Created account in development mode.",
          duration: 4000,
        });
        
        // Handle the pharmacist case specially
        if (role === 'pharmacist' && onRegistrationComplete) {
          onRegistrationComplete(mockUserId, role);
        } else {
          navigate("/");
        }
        
        return;
      } catch (profileError) {
        console.error("Failed to create mock profile:", profileError);
        throw profileError;
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
