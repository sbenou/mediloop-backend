import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create storage key based on project URL
const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Define cookie storage adapter with secure defaults
const cookieStorage = {
  getItem: (key: string) => {
    try {
      const matches = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
      if (!matches) return null;
      
      const value = JSON.parse(decodeURIComponent(matches[1]));
      
      // Check if the stored session is expired
      if (value.expires_at && value.expires_at < Date.now() / 1000) {
        cookieStorage.removeItem(key);
        return null;
      }
      
      return value;
    } catch (e) {
      console.error('Error reading auth cookie:', e);
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      // Set expiration to match token expiration
      const expiresIn = value.expires_in || 3600; // Default to 1 hour if not provided
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + expiresIn);
      
      document.cookie = [
        `${key}=${encodeURIComponent(JSON.stringify(value))}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'secure',
        'samesite=strict',
      ].join('; ');
      
      console.log(`Cookie storage: Session stored for key ${key}`);
    } catch (e) {
      console.error('Error setting auth cookie:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
      console.log(`Cookie storage: Session removed for key ${key}`);
    } catch (e) {
      console.error('Error removing auth cookie:', e);
    }
  }
};

// Enhance our localStorage implementation to be more reliable
const persistentStorage = {
  getItem: (key: string) => {
    try {
      // First try cookies for cross-browser compatibility
      const cookieValue = cookieStorage.getItem(key);
      if (cookieValue) {
        return cookieValue;
      }
      
      // Then try localStorage
      const value = window.localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        
        // Check if session is expired
        if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
          persistentStorage.removeItem(key);
          return null;
        }
        
        return parsed;
      }
      
      // Finally check sessionStorage
      const sessionValue = window.sessionStorage.getItem(key);
      if (sessionValue) {
        return JSON.parse(sessionValue);
      }
      
      return null;
    } catch (e) {
      console.error('Error reading auth data:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: any) => {
    try {
      // Store in multiple locations for redundancy
      cookieStorage.setItem(key, value);
      window.localStorage.setItem(key, JSON.stringify(value));
      window.sessionStorage.setItem(key, JSON.stringify(value));
      
      // Store timestamp for debugging
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(`${key}_timestamp`, timestamp);
      console.log(`Session stored at ${timestamp} for user: ${value?.user?.id || 'unknown'}`);
    } catch (e) {
      console.error('Error setting auth data:', e);
    }
  },
  
  removeItem: (key: string) => {
    try {
      cookieStorage.removeItem(key);
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(`${key}_timestamp`);
    } catch (e) {
      console.error('Error removing auth data:', e);
    }
  }
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: persistentStorage,
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

// Improve session state logging
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state changed: ${event} for user: ${session?.user?.id || 'none'}`);
  
  if (event === 'SIGNED_IN' && session) {
    // Force store session to ensure it persists
    persistentStorage.setItem(STORAGE_KEY, session);
    console.log('Session stored after sign in');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing storage');
    persistentStorage.removeItem(STORAGE_KEY);
  } else if (event === 'TOKEN_REFRESHED' && session) {
    console.log('Token refreshed, updating storage');
    persistentStorage.setItem(STORAGE_KEY, session);
  } else if (event === 'USER_UPDATED' && session) {
    console.log('User updated, updating storage');
    persistentStorage.setItem(STORAGE_KEY, session);
  }
});

// Initial session check with better error handling
(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log(`Initial session loaded for: ${session.user.id}`);
      persistentStorage.setItem(STORAGE_KEY, session);
      
      // Check token expiration and refresh if needed
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt - now < 600) { // Refresh if less than 10 minutes left
        console.log('Session token expiring soon, refreshing...');
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          console.log('Session refreshed successfully');
          persistentStorage.setItem(STORAGE_KEY, data.session);
        }
      }
    } else {
      console.log('No initial session found');
    }
  } catch (error) {
    console.error('Error during initial session check:', error);
  }
})();

// Safe method to get session from storage
export const getSessionFromStorage = () => {
  try {
    return persistentStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error getting session from storage:', e);
    return null;
  }
};
