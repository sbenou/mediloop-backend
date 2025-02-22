
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
      // Use cookies for session storage instead of localStorage
      getItem: (key: string) => {
        const item = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${key}=`))
          ?.split('=')[1];
        try {
          return item ? JSON.parse(decodeURIComponent(item)) : null;
        } catch (e) {
          return null;
        }
      },
      setItem: (key: string, value: any) => {
        // Set cookie with Secure and SameSite attributes
        document.cookie = `${key}=${encodeURIComponent(JSON.stringify(value))}; path=/; secure; samesite=strict`;
      },
      removeItem: (key: string) => {
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      'X-Client-Info': 'lovable-delivery',
    },
  },
};

// Initialize the Supabase client with improved configuration
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
    return null;
  }
};
