
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Define cookie storage adapter
const cookieStorage = {
  getItem: (key: string) => {
    try {
      const matches = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
      return matches ? JSON.parse(decodeURIComponent(matches[1])) : null;
    } catch (e) {
      console.error('Error reading auth cookie:', e);
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      
      document.cookie = [
        `${key}=${encodeURIComponent(JSON.stringify(value))}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'secure',
        'samesite=strict',
      ].join('; ');
    } catch (e) {
      console.error('Error setting auth cookie:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
    } catch (e) {
      console.error('Error removing auth cookie:', e);
    }
  }
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
    storageKey: STORAGE_KEY,
    flowType: 'pkce'
  }
};

// Initialize the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  supabaseOptions
);

// Helper function with improved type safety
export async function fetchFromSupabase<T extends Record<string, any>>(
  query: Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error:', error);
      return null;
    }
    return data as T;
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
}

// Log auth state changes for debugging
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.id);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed for user:', session?.user?.id);
  }
});

// Initial session check
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('Initial session loaded:', session.user.id);
  }
});

export const getSessionFromCookie = () => {
  try {
    const sessionStr = cookieStorage.getItem(STORAGE_KEY);
    return sessionStr || null;
  } catch (e) {
    console.error('Error getting session from cookie:', e);
    return null;
  }
};
