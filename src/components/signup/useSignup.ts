
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { UserRole } from "./SignupForm";

export const useSignup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExpiresAt, setRateLimitExpiresAt] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
    userRole: string,
    licenseNumber: string
  ) => {
    if (rateLimitExpiresAt && Date.now() < rateLimitExpiresAt) {
      const remainingMinutes = Math.ceil((rateLimitExpiresAt - Date.now()) / 60000);
      toast({
        variant: "destructive",
        title: "Rate Limit Active",
        description: `Please wait ${remainingMinutes} minute(s) before trying again.`,
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    console.log("Starting signup process for email:", email);

    try {
      // Create auth user first
      console.log("Creating auth user...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: userRole,
          },
        },
      });

      if (authError) {
        console.error("Auth user creation error:", authError);
        if (authError.message.includes('email rate limit') || 
            authError.code === 'over_email_send_rate_limit') {
          const rateLimitDuration = 5 * 60 * 1000;
          const expiresAt = Date.now() + rateLimitDuration;
          
          setRateLimitExpiresAt(expiresAt);
          setIsSubmitting(false);

          toast({
            variant: "destructive",
            title: "Email Rate Limit Reached",
            description: "Too many signup attempts. Please wait 5 minutes before requesting another verification email.",
          });
          return;
        }
        throw authError;
      }

      console.log("Auth user created successfully:", authData.user?.id);

      if (!authData.user?.id) {
        throw new Error("User creation failed - no user ID returned");
      }

      // First check if profile exists
      console.log("Checking for existing profile...");
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Error checking existing profile:", profileCheckError);
        throw profileCheckError;
      }

      if (!existingProfile) {
        console.log("No existing profile found, creating new profile...");
        // Create the profile only if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email,
            full_name: name,
            role: userRole,
            license_number: licenseNumber || null,
          }]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Log additional details about the current state
          console.log("Attempted profile creation with:", {
            userId: authData.user.id,
            email,
            role: userRole,
          });
          throw new Error("Failed to create user profile: " + profileError.message);
        }
        console.log("Profile created successfully");
      } else {
        console.log("Profile already exists:", existingProfile);
      }

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error("Signup error:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSignup,
    isSubmitting,
    rateLimitExpiresAt
  };
};
