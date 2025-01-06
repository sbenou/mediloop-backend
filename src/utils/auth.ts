import { supabase } from "@/lib/supabase";

// Get the base URL for the current project
const getBaseUrl = () => {
  const url = window.location.href;
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
    // Get the complete URL including the project path
    const projectPath = url.substring(projectsIndex);
    const baseUrl = `${window.location.origin}${projectPath}`;
    // Remove any trailing slashes and additional paths
    return baseUrl.split('/').slice(0, 5).join('/');
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