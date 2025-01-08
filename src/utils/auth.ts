import { supabase } from '@/lib/supabase';

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  
  // Get the current domain and ensure we stay on the same domain
  const currentDomain = window.location.origin;
  const redirectTo = `${currentDomain}/auth/callback?type=recovery`;
  
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
};