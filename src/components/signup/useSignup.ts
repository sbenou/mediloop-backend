
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
    console.log("Starting signup process for email:", email);

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
      // First, check if user already exists
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      
      if (existingUser) {
        throw new Error("An account with this email already exists");
      }

      console.log("Creating auth user...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: userRole,
            license_number: licenseNumber || null,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('email rate limit') || 
            authError.code === 'over_email_send_rate_limit') {
          const rateLimitDuration = 5 * 60 * 1000;
          setRateLimitExpiresAt(Date.now() + rateLimitDuration);
          
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
        throw new Error("User creation failed - no user ID returned");
      }

      console.log("Auth user created successfully:", authData.user.id);

      // Use RPC call to create profile
      const { error: rpcError } = await supabase.rpc('create_profile_secure', {
        user_id: authData.user.id,
        user_role: userRole,
        user_full_name: name,
        user_email: email,
        user_license_number: licenseNumber || null
      });

      if (rpcError) {
        console.error("Profile creation error:", rpcError);
        throw new Error("Failed to create user profile: " + rpcError.message);
      }

      console.log("Profile created successfully");

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
