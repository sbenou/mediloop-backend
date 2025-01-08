import { supabase } from '@/lib/supabase';

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  
  // Get the current domain and ensure we stay on the preview domain
  const currentDomain = window.location.origin;
  // Use the same domain for the redirect
  const redirectTo = `${currentDomain}/auth/callback?type=recovery`;
  
  console.log("Reset password redirect URL:", redirectTo);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { data, error };
};