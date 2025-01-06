import { supabase } from "@/lib/supabase";

// Get the base URL for the current project
export const getBaseUrl = () => {
  const url = window.location.href;
  // Get the complete URL up to /reset-password
  return url.split('/login')[0] + '/reset-password';
};

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const redirectTo = getBaseUrl();
  console.log("Reset password redirect URL:", redirectTo);
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
};