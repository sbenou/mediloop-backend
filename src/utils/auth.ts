import { supabase } from "@/lib/supabase";

// Get the base URL for the current project
export const getBaseUrl = () => {
  const url = window.location.href;
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
    // Get the complete URL including the project path
    const projectPath = url.substring(projectsIndex);
    const baseUrl = `${window.location.origin}${projectPath}`;
    // Remove any trailing slashes and additional paths
    const cleanUrl = baseUrl.split('/').slice(0, 5).join('/');
    // Append the reset-password path
    return `${cleanUrl}/reset-password`;
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