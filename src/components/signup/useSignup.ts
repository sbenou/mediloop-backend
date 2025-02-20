
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
      
      // Wait a short moment to allow the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Checking for existing profile...");
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileCheckError) {
        throw profileCheckError;
      }

      if (!existingProfile) {
        console.log("No existing profile found, creating new profile...");
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([{
            id: authData.user.id,
            email,
            full_name: name,
            role: userRole,
            license_number: licenseNumber || null,
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          console.log("Profile creation error:", profileError);
          console.log("Attempted profile creation with:", {
            userId: authData.user.id,
            email,
            role: userRole,
          });
          throw new Error("Failed to create user profile: " + profileError.message);
        }
      } else {
        console.log("Profile exists, updating if needed...");
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email,
            full_name: name,
            role: userRole,
            license_number: licenseNumber || null,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          throw updateError;
        }
      }

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.log("Signup error:", error);
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
