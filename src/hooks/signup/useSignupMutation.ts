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
      // In development mode, don't enforce rate limits
      if (process.env.NODE_ENV === 'development') {
        if (authError.message.includes('email rate limit') || 
            authError.code === 'over_email_send_rate_limit') {
          console.warn('Rate limit bypassed in development mode');
          // Return a mock successful response
          return {
            id: 'dev-bypass-' + Date.now(),
            email,
            ...authData?.user
          };
        }
      }
      throw authError;
    }

    if (!authData.user?.id) {
      throw new Error("User creation failed - no user ID returned");
    }

    return authData.user;
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