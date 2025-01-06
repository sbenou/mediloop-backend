import { supabase } from "@/lib/supabase";

// Get the complete base URL including the project path and reset-password route
export const getBaseUrl = () => {
  const url = window.location.href;
  if (url.includes('lovableproject.com')) {
    const projectId = url.split('.lovableproject.com')[0].split('//')[1];
    return `https://${projectId}.lovableproject.com/reset-password`;
  }
  const projectsIndex = url.indexOf('/projects/');
  if (projectsIndex !== -1) {
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