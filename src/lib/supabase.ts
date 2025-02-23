
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: key => {
        const item = localStorage.getItem(key);
        console.log('Getting from storage:', { key, value: item }); // Debug log
        return item;
      },
      setItem: (key, value) => {
        console.log('Setting to storage:', { key, value }); // Debug log
        localStorage.setItem(key, value);
      },
      removeItem: key => {
        console.log('Removing from storage:', { key }); // Debug log
        localStorage.removeItem(key);
      }
    }
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      'X-Client-Info': 'lovable-delivery',
    },
  },
  // Enable debug mode for development
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

// Helper function with improved type safety and logging
export async function fetchFromSupabase<T extends Record<string, any>>(
  query: Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    console.log('Starting Supabase query:', query);
    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error:', error);
      return null;
    }
    console.log('Supabase query successful:', data);
    return data as T;
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
}

// Handle auth state changes and log them
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', { event, session: session?.user?.id });
});

// Handle initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('Initial session loaded:', session.user.id);
  }
});

export const getSessionFromCookie = () => {
  try {
    const sessionStr = localStorage.getItem('sb-session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (e) {
    console.error('Error parsing session:', e);
    return null;
  }
};
