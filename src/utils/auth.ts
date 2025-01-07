import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  // We need to use the full URL to the callback endpoint
  const redirectTo = `${window.location.origin}/reset-password`;
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
};