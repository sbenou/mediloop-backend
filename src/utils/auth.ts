import { supabase } from "@/lib/supabase";

// Get the base URL for the current project
export const getBaseUrl = () => {
  // Get the current URL
  const currentUrl = window.location.href;
  
  // Extract the project domain (e.g., "xyz.lovableproject.com")
  const projectDomain = window.location.hostname;
  
  // Construct the base URL with HTTPS
  const baseUrl = `https://${projectDomain}`;
  
  // Always append /reset-password to ensure correct redirection
  return `${baseUrl}/reset-password`;
};

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const redirectTo = getBaseUrl();
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo
  });
};