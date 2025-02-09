
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/components/signup/SignupForm";

const roleMapping: Record<UserRole, string> = {
  patient: "user",
  doctor: "doctor",
  pharmacist: "pharmacist",
  delivery: "user"
};

export const useSignupMutation = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExpiresAt, setRateLimitExpiresAt] = useState<number | null>(null);

  const createAuthUser = async (email: string, password: string, name: string, userRole: UserRole) => {
    console.log("Creating auth user...");
    
    // Sign out any existing session first
    await supabase.auth.signOut();
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: roleMapping[userRole],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (authError) {
        console.error("Auth user creation error:", authError);
        
        // Specific error handling
        if (authError.message?.includes('rate limit') || 
            authError.code === 'over_email_send_rate_limit') {
          throw new Error('Email rate limit reached. Please wait 5 minutes before trying again.');
        }
        
        if (authError.message?.includes('Error sending confirmation email')) {
          console.warn('Email sending error detected, checking environment...');
          
          // In development mode, return mock data
          if (process.env.NODE_ENV === 'development') {
            console.warn('Development mode detected - bypassing email confirmation');
            return {
              id: 'dev-mock-' + Date.now(),
              email,
              role: roleMapping[userRole],
              user_metadata: {
                full_name: name
              }
            };
          }
          
          throw new Error('Failed to send confirmation email. Please make sure you have verified your domain in Supabase and try again.');
        }
        
        throw authError;
      }

      if (!authData.user?.id) {
        throw new Error("User creation failed - no user ID returned");
      }

      return authData.user;
    } catch (error) {
      // If we're in development and hit a rate limit, return mock data
      if (process.env.NODE_ENV === 'development' && 
         error instanceof Error && 
         (error.message?.includes('rate limit') || 
          error.message?.includes('over_email_send_rate_limit'))) {
        console.warn('Rate limit bypassed in development mode');
        return {
          id: 'dev-mock-' + Date.now(),
          email,
          role: roleMapping[userRole],
          user_metadata: {
            full_name: name
          }
        };
      }
      throw error;
    }
  };

  const createUserProfile = async (userId: string, email: string, name: string, userRole: UserRole, licenseNumber: string) => {
    try {
      console.log("Creating new profile...");
      const { error: profileError } = await supabase.rpc('create_profile', {
        user_id: userId,
        user_role: roleMapping[userRole],
        user_full_name: name,
        user_email: email,
        user_license_number: licenseNumber || null
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create user profile: " + profileError.message);
      }
      console.log("Profile created successfully");
    } catch (error) {
      console.error("Error in createUserProfile:", error);
      throw error;
    }
  };

  return {
    isSubmitting,
    rateLimitExpiresAt,
    setIsSubmitting,
    setRateLimitExpiresAt,
    createAuthUser,
    createUserProfile,
  };
};
