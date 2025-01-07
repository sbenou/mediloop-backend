import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const currentUrl = window.location.href;
  const projectPath = currentUrl.split('/projects/')[1].split('/')[0];
  const redirectUrl = `${window.location.origin}/projects/${projectPath}/reset-password`;
  console.log("Reset password redirect URL:", redirectUrl);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });
};