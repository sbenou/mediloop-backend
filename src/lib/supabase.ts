
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create a custom storage implementation
const customStorage = {
  getItem: (key: string): string | null => {
    const item = localStorage.getItem(key);
    console.log('Getting from storage:', { key, value: item });
    return item;
  },
  setItem: (key: string, value: string): void => {
    console.log('Setting to storage:', { key, value });
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    console.log('Removing from storage:', { key });
    localStorage.removeItem(key);
  },
  clear: () => {
    console.log('Clearing storage');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage
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
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', { event, session: session?.user?.id });
  if (event === 'SIGNED_OUT') {
    customStorage.clear();
  }
});

// Handle initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    customStorage.clear();
  } else {
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
