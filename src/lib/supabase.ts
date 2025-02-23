
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: {
      getItem: (key) => {
        const item = document.cookie
          .split('; ')
          .find(cookie => cookie.startsWith(`${key}=`));
        if (!item) return null;
        return JSON.parse(decodeURIComponent(item.split('=')[1]));
      },
      setItem: (key, value) => {
        // Set cookie with secure parameters and domain-level scope
        document.cookie = `${key}=${encodeURIComponent(JSON.stringify(value))}; path=/; secure; samesite=strict; max-age=2592000`; // 30 days
      },
      removeItem: (key) => {
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
      },
    }
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      'X-Client-Info': 'lovable-delivery',
    },
  },
};

// Initialize the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  supabaseOptions
);

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', { event, session: session?.user?.id });
});
