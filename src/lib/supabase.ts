
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Initialize the Supabase client with improved session handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: localStorage,
  },
  global: {
    headers: {
      'X-Client-Info': 'lovable-delivery'
    }
  }
});

// Handle auth state changes and log them
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', { event, session: session?.user?.id });
  
  if (event === 'SIGNED_OUT') {
    // Clear any stored tokens
    localStorage.removeItem('supabase.auth.token');
  }
});

// Handle initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    // Clear any stale tokens if no valid session exists
    localStorage.removeItem('supabase.auth.token');
  }
});
