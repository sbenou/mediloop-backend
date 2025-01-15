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
      // First attempt to sign in
      console.log("Attempting sign in...");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Auth error:", authError);
        handleLoginError(authError);
        return;
      }

      if (!authData.user) {
        console.error("No user data returned");
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unable to complete login. Please try again.",
          duration: 6000,
        });
        return;
      }

      // After successful auth, check the profile
      console.log("Checking for user profile...");
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error("Profile check error:", profileError);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Profile Error",
          description: "There was an error accessing your profile. Please contact support.",
          duration: 6000,
        });
        return;
      }

      console.log("Login successful, user data:", {
        id: authData.user.id,
        email: authData.user.email,
        profile: userProfile
      });
      
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Logged in successfully",
        duration: 4000,
      });
      
      onSuccess();

    } catch (error: any) {
      console.error("Unexpected error during login:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        duration: 6000,
      });
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
    } else if (error.status === 429 || error.message.includes('rate_limit')) {
      toast({
        variant: "destructive",
        title: "Too Many Attempts",
        description: "You've made too many requests. Please wait a few minutes before trying again.",
        duration: 8000,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again or use the reset password link below.",
        duration: 6000,
      });
    }
    setIsLoading(false);
  };

  return {
    isLoading,
    handleLogin
  };
};