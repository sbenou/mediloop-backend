import { supabase } from '@/lib/supabase';

export const sendPasswordResetEmail = async (email: string) => {
  // Get the current domain
  const redirectTo = `${window.location.origin}/auth/callback`;
  console.log("Sending password reset email...");
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
};