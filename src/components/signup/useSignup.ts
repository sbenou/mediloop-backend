import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { UserRole } from "./SignupForm";

// Map frontend roles to database roles
const roleMapping: Record<UserRole, string> = {
  patient: "user",
  doctor: "doctor",
  pharmacist: "pharmacist",
  delivery: "user" // Delivery persons get basic user role for now
};

export const useSignup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExpiresAt, setRateLimitExpiresAt] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
    userRole: UserRole,
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

    try {
      // First, get the role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleMapping[userRole])
        .single();

      if (roleError) {
        throw new Error(`Failed to fetch role ID: ${roleError.message}`);
      }

      if (!roleData?.id) {
        throw new Error(`Role '${roleMapping[userRole]}' not found`);
      }

      // Create auth user with minimal metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authError) {
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

      if (!authData.user?.id) {
        throw new Error("User creation failed");
      }

      // Create the profile with the correct structure
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: name,
          role: roleMapping[userRole], // Use the role name directly
          license_number: licenseNumber || null,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create user profile");
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