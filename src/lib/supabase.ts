import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Get the base URL for the current project
const getBaseUrl = () => {
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'x-application-name': window.location.hostname,
    },
  },
});

// Configure auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
  
  if (event === 'PASSWORD_RECOVERY') {
    // Handle the hash fragment in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    
    if (access_token && refresh_token) {
      // Store the tokens in the session
      supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    }
    
    // Get the base URL for redirection
    const baseUrl = getBaseUrl();
    // Redirect to reset-password within the project path
    window.location.href = baseUrl;
  }
});