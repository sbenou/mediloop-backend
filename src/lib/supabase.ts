
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create storage key based on project URL
const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Improved storage that works better across tabs with browser storage events
const crossTabStorage = {
  getItem: (key: string) => {
    try {
      // First try localStorage for persistence
      const storedValue = window.localStorage.getItem(key);
      if (!storedValue) return null;
      
      const parsed = JSON.parse(storedValue);
      
      // Check if session is expired
      if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
        crossTabStorage.removeItem(key);
        return null;
      }
      
      return parsed;
    } catch (e) {
      console.error('Error reading auth data:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: any) => {
    try {
      // Store in localStorage for cross-tab persistence
      window.localStorage.setItem(key, JSON.stringify(value));
      
      // Also store in sessionStorage as backup
      window.sessionStorage.setItem(key, JSON.stringify(value));
      
      // Track when session was stored
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(`${key}_timestamp`, timestamp);
      
      console.log(`Auth: Session stored at ${timestamp} for user: ${value?.user?.id || 'unknown'}`);
    } catch (e) {
      console.error('Error setting auth data:', e);
    }
  },
  
  removeItem: (key: string) => {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(`${key}_timestamp`);
      console.log('Auth: Session removed from storage');
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
    storage: crossTabStorage,
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

// Broadcast channel for cross-tab communication about auth state
const authChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('auth_state_channel') 
  : null;

// Setup cross-tab auth state synchronization
if (authChannel) {
  // Listen for auth state changes from other tabs
  authChannel.onmessage = async (event) => {
    if (event.data?.type === 'SIGNED_IN') {
      console.log('Auth: Received signin event from another tab');
      // Force refresh the session
      await supabase.auth.refreshSession();
    } else if (event.data?.type === 'SIGNED_OUT') {
      console.log('Auth: Received signout event from another tab');
      // Clear local session
      await supabase.auth.signOut({ scope: 'local' });
      window.location.reload();
    }
  };
}

// Improve session state synchronization across tabs
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth: State changed: ${event} for user: ${session?.user?.id || 'none'}`);
  
  if (event === 'SIGNED_IN' && session) {
    // Force store session to ensure it persists
    crossTabStorage.setItem(STORAGE_KEY, session);
    console.log('Auth: Session stored after sign in');
    
    // Broadcast signin to other tabs
    if (authChannel) {
      authChannel.postMessage({ type: 'SIGNED_IN', timestamp: Date.now() });
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('Auth: User signed out, clearing storage');
    crossTabStorage.removeItem(STORAGE_KEY);
    
    // Broadcast signout to other tabs
    if (authChannel) {
      authChannel.postMessage({ type: 'SIGNED_OUT', timestamp: Date.now() });
    }
  } else if (event === 'TOKEN_REFRESHED' && session) {
    console.log('Auth: Token refreshed, updating storage');
    crossTabStorage.setItem(STORAGE_KEY, session);
  } else if (event === 'USER_UPDATED' && session) {
    console.log('Auth: User updated, updating storage');
    crossTabStorage.setItem(STORAGE_KEY, session);
  }
});

// Setup periodic session check to prevent expiration
const setupSessionRefresh = () => {
  // Check session every 4 minutes
  const interval = setInterval(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // If session exists but expires in less than 5 minutes, refresh it
        const expiresAt = data.session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt - now < 300) {
          console.log('Auth: Session expiring soon, refreshing token');
          await supabase.auth.refreshSession();
        }
      }
    } catch (error) {
      console.error('Error in session refresh:', error);
    }
  }, 240000); // 4 minutes
  
  // Clear interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
};

// Initial session setup
(async () => {
  try {
    // Get current session state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log(`Auth: Initial session loaded for: ${session.user.id}`);
      // Explicitly store in storage
      crossTabStorage.setItem(STORAGE_KEY, session);
      
      // Check and refresh token if needed
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt - now < 600) { // Less than 10 minutes left
        console.log('Auth: Session token expiring soon, refreshing...');
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          console.log('Auth: Session refreshed successfully');
          crossTabStorage.setItem(STORAGE_KEY, data.session);
        }
      }
      
      // Set up session refresh
      setupSessionRefresh();
    } else {
      console.log('Auth: No initial session found');
    }
  } catch (error) {
    console.error('Error during initial session check:', error);
  }
})();

// Safe method to get session from storage
export const getSessionFromStorage = () => {
  try {
    return crossTabStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error getting session from storage:', e);
    return null;
  }
};

// Function to sync session when tab becomes visible
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('Auth: Tab became visible, checking session');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        console.log('Auth: Session verification failed after tab visibility change:', error);
      } else {
        console.log('Auth: Session verified after tab visibility change');
      }
    } catch (err) {
      console.error('Auth: Error during visibility session check:', err);
    }
  }
};

// Add visibility change handler for session syncing
document.addEventListener('visibilitychange', handleVisibilityChange);
