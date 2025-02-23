
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Get stored session if it exists
const getStoredSession = () => {
  try {
    const sessionStr = localStorage.getItem('sb-' + supabaseUrl);
    if (!sessionStr) return null;
    const { currentSession } = JSON.parse(sessionStr);
    return currentSession;
  } catch (e) {
    console.error('Error parsing stored session:', e);
    return null;
  }
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-' + supabaseUrl,
    flowType: 'pkce'
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      'X-Client-Info': 'lovable-delivery',
    },
  },
  db: {
    schema: 'public',
  },
};

// Initialize the Supabase client with improved configuration
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  supabaseOptions
);

// Handle auth state changes and log them
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', { event, session: session?.user?.id });
  
  if (event === 'SIGNED_IN' && session) {
    // Ensure session is stored
    localStorage.setItem('sb-' + supabaseUrl, JSON.stringify({
      currentSession: session,
      expiresAt: session.expires_at
    }));
  } else if (event === 'SIGNED_OUT') {
    // Clear only Supabase-related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }
});

// Initialize session from storage if available
const storedSession = getStoredSession();
if (storedSession) {
  console.log('Found stored session, initializing...');
  supabase.auth.setSession(storedSession);
}

// Handle initial session check
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('Initial session loaded:', session.user.id);
    // Ensure session is stored
    localStorage.setItem('sb-' + supabaseUrl, JSON.stringify({
      currentSession: session,
      expiresAt: session.expires_at
    }));
  } else {
    console.log('No initial session found');
    // Clear only Supabase-related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }
});

export const getSessionFromStorage = () => {
  return getStoredSession();
};
