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

    return authData.user;
  };

  const createUserProfile = async (userId: string, email: string, name: string, userRole: UserRole, licenseNumber: string) => {
    console.log("Checking for existing profile...");
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileCheckError) {
      console.error("Error checking existing profile:", profileCheckError);
    }

    if (!existingProfile) {
      console.log("No existing profile found, creating new profile...");
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email,
          full_name: name,
          role: roleMapping[userRole],
          license_number: licenseNumber || null,
        }]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create user profile: " + profileError.message);
      }
      console.log("Profile created successfully");
    } else {
      console.log("Profile already exists:", existingProfile);
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