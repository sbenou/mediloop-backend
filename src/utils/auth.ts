import { supabase } from "@/lib/supabase";

// Get the base URL for the current project
export const getBaseUrl = () => {
  const url = window.location.href;
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
    // Extract the project ID from the URL
    const projectPath = url.substring(projectsIndex);
    const projectId = projectPath.split('/')[2];
    // Construct the correct reset password URL with the reset-password path
    const baseUrl = `${window.location.origin}/projects/${projectId}`;
    console.log('Reset password redirect URL:', `${baseUrl}/reset-password`);
    return `${baseUrl}/reset-password`;
  }
  // Fallback for development environment
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