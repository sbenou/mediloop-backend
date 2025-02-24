
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Improved cookie storage implementation with secure options
const cookieStorage = {
  getItem: (key: string) => {
    const item = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${key}=`))
      ?.split('=')[1];
    try {
      return item ? JSON.parse(decodeURIComponent(item)) : null;
    } catch (e) {
      console.error('Error parsing cookie:', e);
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    // Set cookie with improved security and persistence
    const date = new Date();
    // Set expiry to 1 year from now
    date.setFullYear(date.getFullYear() + 1);
    
    document.cookie = `${key}=${encodeURIComponent(JSON.stringify(value))}; expires=${date.toUTCString()}; path=/; secure; samesite=strict`;
  },
  removeItem: (key: string) => {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
  },
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
    storageKey: 'supabase.auth.token',
    // Set a longer window for token refresh
    flowType: 'pkce',
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
    const sessionStr = document.cookie
      .split('; ')
      .find((row) => row.startsWith('supabase.auth.token='))
      ?.split('=')[1];
    return sessionStr ? JSON.parse(decodeURIComponent(sessionStr)) : null;
  } catch (e) {
    console.error('Error getting session from cookie:', e);
    return null;
  }
};
