import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
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
    
    // Get the full current path (including project ID)
    const currentPath = window.location.pathname;
    // Extract the project path (everything up to the last segment)
    const projectPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    // Redirect to reset-password within the project path
    window.location.href = `${window.location.origin}${projectPath}/reset-password`;
  }
});