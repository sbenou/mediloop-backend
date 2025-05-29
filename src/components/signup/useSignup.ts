
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { authService, SignUpData } from "@/services/authService";
import { useNavigate } from "react-router-dom";

export const useSignup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitExpiresAt, setRateLimitExpiresAt] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
    role: string,
    licenseNumber: string,
    onRegistrationComplete?: (userId: string, role: string) => void
  ) => {
    setIsSubmitting(true);
    console.log('[useSignup] Starting signup process for role:', role);

    try {
      const signUpData: SignUpData = {
        email,
        password,
        fullName: name,
        role,
        licenseNumber: licenseNumber || undefined,
      };

      const { user, session, error } = await authService.signUp(signUpData);

      if (error) {
        console.error('[useSignup] Signup error:', error);
        
        let errorMessage = "Failed to create account. Please try again.";
        
        if (error.message.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes('rate_limit') || error.message.includes('too_many_requests')) {
          errorMessage = "Too many signup attempts. Please wait a few minutes before trying again.";
          setRateLimitExpiresAt(Date.now() + 5 * 60 * 1000); // 5 minutes
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = "Password should be at least 6 characters long.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        }

        toast({
          variant: "destructive",
          title: "Signup failed",
          description: errorMessage,
        });
        
        throw new Error(errorMessage);
      }

      if (!user) {
        const errorMessage = "Failed to create user account. Please try again.";
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: errorMessage,
        });
        throw new Error(errorMessage);
      }

      console.log('[useSignup] Signup successful for user:', user.id);

      // Show success message
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: "Account created successfully!",
          description: "Email verification is bypassed in development mode. You can now log in.",
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account before logging in.",
        });
      }

      // Call the completion callback if provided
      if (onRegistrationComplete) {
        onRegistrationComplete(user.id, role);
      } else {
        // If no callback provided, navigate to login
        navigate('/login', { 
          state: { 
            email, 
            message: 'Account created successfully! Please log in.' 
          } 
        });
      }

    } catch (error) {
      console.error('[useSignup] Signup process failed:', error);
      // Error is already handled above, just re-throw
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
