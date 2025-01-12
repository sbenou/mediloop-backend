import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useLogin = (onSuccess: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("Attempting login with email:", email);

    try {
      // First, check if the user exists in profiles
      console.log("Checking for user profile...");
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !userProfile) {
        console.log("Profile check result:", { userProfile, profileError });
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "Your account setup may be incomplete. Please try signing up again.",
          duration: 6000,
        });
        return;
      }

      // Sign in with Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        handleLoginError(error);
        return;
      }

      if (data.user) {
        console.log("Login successful, user data:", {
          id: data.user.id,
          email: data.user.email,
          lastSignIn: data.user.last_sign_in_at
        });
        
        toast({
          title: "Success",
          description: "Logged in successfully",
          duration: 4000,
        });

        // Make sure we're calling onSuccess after everything is confirmed
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    } catch (error: any) {
      console.error("Unexpected error during login:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (error: any) => {
    console.error("Login error details:", {
      message: error.message,
      status: error.status,
      name: error.name
    });
    
    if (error.message.includes('Email not confirmed')) {
      toast({
        variant: "destructive",
        title: "Email Not Confirmed",
        description: "Please check your email and confirm your account before logging in. Don't forget to check your spam folder.",
        duration: 6000,
      });
      return;
    }
    
    if (error.status === 429 || error.message.includes('rate_limit')) {
      toast({
        variant: "destructive",
        title: "Too Many Attempts",
        description: "You've made too many requests. Please wait a few minutes before trying again.",
        duration: 8000,
      });
      return;
    }
    
    toast({
      variant: "destructive",
      title: "Login Failed",
      description: "Invalid email or password. Please try again or use the reset password link below.",
      duration: 6000,
    });
  };

  return {
    isLoading,
    handleLogin
  };
};