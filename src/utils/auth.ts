import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  return await supabase.auth.resetPasswordForEmail(email);
};