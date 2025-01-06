import { supabase } from "@/lib/supabase";

// Get the complete base URL including the project path
export const getBaseUrl = () => {
  const url = window.location.href;
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
    // Extract the base URL up to the project ID
    const baseUrl = url.substring(0, url.indexOf('/', projectsIndex + 10));
    return `${baseUrl}/reset-password`;
  }
  return `${window.location.origin}/reset-password`;
};

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getBaseUrl(),
  });
};