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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: roleMapping[userRole],
        },
      },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      throw authError;
    }

    if (!authData.user?.id) {
      throw new Error("User creation failed - no user ID returned");
    }

    console.log("Auth user created successfully with ID:", authData.user.id);
    return authData.user;
  };

  const createUserProfile = async (userId: string, email: string, name: string, userRole: UserRole, licenseNumber: string) => {
    try {
      console.log("Creating new profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email,
          full_name: name,
          role: roleMapping[userRole],
          license_number: licenseNumber || null,
        }])
        .select()
        .single();

      if (error) {
        console.error("Profile creation error:", error);
        throw new Error("Failed to create user profile: " + error.message);
      }

      console.log("Profile created successfully:", data);
      return data;
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