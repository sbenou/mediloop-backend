
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

// Use both localStorage and cookie storage for better compatibility
const localStorage = {
  getItem: (key: string) => {
    try {
      // First try to get from cookie for cross-browser compatibility
      const cookieValue = cookieStorage.getItem(key);
      if (cookieValue) {
        console.log(`Local storage: Found session in cookie for key ${key}`);
        return cookieValue;
      }
      
      // Fallback to localStorage
      const value = window.localStorage.getItem(key);
      if (!value) {
        console.log(`Local storage: No session found for key ${key}`);
        return null;
      }
      
      const parsed = JSON.parse(value);
      
      // Check if the stored session is expired
      if (parsed.expires_at && parsed.expires_at < Date.now() / 1000) {
        console.log(`Local storage: Session expired for key ${key}, removing`);
        localStorage.removeItem(key);
        return null;
      }
      
      console.log(`Local storage: Found valid session for key ${key}`);
      return parsed;
    } catch (e) {
      console.error('Error reading auth from localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      // Store in both cookie and localStorage for redundancy
      cookieStorage.setItem(key, value);
      
      // Also store in localStorage
      window.localStorage.setItem(key, JSON.stringify(value));
      
      // Try to store session explicitly with timestamp for debugging
      try {
        window.localStorage.setItem(`${key}_timestamp`, JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: value?.user?.id || 'unknown'
        }));
      } catch (e) {
        // Ignore this error as it's just for debugging
      }
      
      // Log success for debugging
      console.log(`Session stored successfully for key: ${key}`);
      if (value?.user?.id) {
        console.log(`Session stored for user: ${value.user.id}`);
      }
    } catch (e) {
      console.error('Error setting auth in localStorage:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      cookieStorage.removeItem(key);
      window.localStorage.removeItem(key);
      window.localStorage.removeItem(`${key}_timestamp`);
      console.log(`Local storage: Session removed for key ${key}`);
    } catch (e) {
      console.error('Error removing auth from localStorage:', e);
    }
  }
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage, // Use our combined storage implementation
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
    
    // Explicitly store session again to ensure it's properly saved
    if (session) {
      localStorage.setItem(STORAGE_KEY, session);
    }
    
    console.log('Session storage check after sign in:', localStorage.getItem(STORAGE_KEY) ? 'Session found' : 'No session found');
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    // Clear any remaining session data
    localStorage.removeItem(STORAGE_KEY);
    cookieStorage.removeItem(STORAGE_KEY);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed for user:', session?.user?.id);
    
    // Explicitly store refreshed session
    if (session) {
      localStorage.setItem(STORAGE_KEY, session);
      console.log('Refreshed token stored in session storage');
    }
  }
});

// Initial session check and potential refresh
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('Initial session loaded:', session.user.id);
    // Store the session explicitly to ensure it's saved
    localStorage.setItem(STORAGE_KEY, session);
    
    // Verify token expiration and refresh if needed
    const expiresAt = session?.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt - now < 600) { // Refresh if less than 10 minutes left
      supabase.auth.refreshSession().then(({ data }) => {
        if (data.session) {
          console.log('Session refreshed during initial load');
          // Store the refreshed session
          localStorage.setItem(STORAGE_KEY, data.session);
        }
      });
    }
  } else {
    console.log('No initial session found');
  }
});

// Safe method to get session from storage
export const getSessionFromStorage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error getting session from storage:', e);
    return null;
  }
};
