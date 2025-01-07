import { supabase } from '@/lib/supabase';

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  
  // Get the base URL without any query parameters
  const baseUrl = window.location.origin;
  const redirectTo = `${baseUrl}/auth/callback`;
  
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    emailRedirectTo: redirectTo
  });
};