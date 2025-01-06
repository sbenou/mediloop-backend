import { supabase } from "@/lib/supabase";

// Get the base URL for the current project
const getBaseUrl = () => {
  const url = window.location.href;
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
    // Get the URL up to the project ID
    const baseUrl = url.substring(0, url.indexOf('/', projectsIndex + 10));
    return baseUrl;
  }
  return window.location.origin;
};

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const baseUrl = getBaseUrl();
  const redirectTo = `${baseUrl}/reset-password`;
  console.log("Reset password redirect URL:", redirectTo);
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });
};