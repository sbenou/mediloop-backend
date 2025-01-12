import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/components/signup/SignupForm";
import { useSignupMutation } from "./useSignupMutation";

export const useSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isSubmitting,
    rateLimitExpiresAt,
    setIsSubmitting,
    setRateLimitExpiresAt,
    createAuthUser,
    createUserProfile,
  } = useSignupMutation();

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
    console.log("Starting signup process for email:", email);

    try {
      const user = await createAuthUser(email, password, name, userRole);
      
      if (!user || !user.id) {
        throw new Error("Failed to create user account");
      }

      await createUserProfile(user.id, email, name, userRole, licenseNumber);

      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
      });
      
      // Add a small delay before navigation to ensure toast is visible
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error: any) {
      console.error("Signup error:", error);
      
      if (error.message.includes('email rate limit') || 
          error.code === 'over_email_send_rate_limit') {
        const rateLimitDuration = 5 * 60 * 1000;
        const expiresAt = Date.now() + rateLimitDuration;
        
        setRateLimitExpiresAt(expiresAt);

        toast({
          variant: "destructive",
          title: "Email Rate Limit Reached",
          description: "Too many signup attempts. Please wait 5 minutes before requesting another verification email.",
        });
        return;
      }
      
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