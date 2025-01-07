import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  // Use /auth/callback as the redirect URL, which will be handled by EmailConfirmationHandler
  const redirectTo = `${window.location.origin}/auth/callback`;
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
};