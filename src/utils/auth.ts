import { supabase } from '@/lib/supabase';

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  
  // Get the current domain and ensure it's the preview domain for password reset
  const currentDomain = window.location.origin;
  const previewDomain = currentDomain.replace('lovableproject.com', 'lovable.app');
  const redirectTo = `${previewDomain}/auth/callback?type=recovery`;
  
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
};