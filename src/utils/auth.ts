import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const currentPath = window.location.pathname;
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${currentPath}/reset-password`
  });
};