import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const currentUrl = window.location.href;
  const baseUrl = currentUrl.split('/').slice(0, -1).join('/');
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/reset-password`
  });
};