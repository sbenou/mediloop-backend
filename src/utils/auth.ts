import { supabase } from "@/lib/supabase";

// Get the complete base URL including the project path
export const getBaseUrl = () => {
  const url = window.location.href;
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
    // Extract the base URL up to the project ID and append reset-password
    return url.substring(0, url.indexOf('/', projectsIndex + 10)) + '/reset-password';
  }
  return `${window.location.origin}/reset-password`;
};

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const redirectTo = getBaseUrl();
  console.log("Reset password redirect URL:", redirectTo);
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
};