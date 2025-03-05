
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create storage key based on project URL
const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Enhanced persistent storage implementation with multiple fallbacks
const persistentStorage = {
  getItem: (key: string) => {
    try {
      // First try localStorage (most persistent)
      const localValue = localStorage.getItem(key);
      if (localValue) {
        try {
          const parsed = JSON.parse(localValue);
          
          // Check if session is expired
          if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
            console.log('Session expired in localStorage, removing');
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            return null;
          }
          
          return parsed;
        } catch (e) {
          console.error('Error parsing localStorage value:', e);
        }
      }
      
      // Then try sessionStorage as fallback
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue) {
        try {
          const parsed = JSON.parse(sessionValue);
          
          // Check if session is expired
          if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
            console.log('Session expired in sessionStorage, removing');
            sessionStorage.removeItem(key);
            return null;
          }
          
          // Sync back to localStorage for persistence
          localStorage.setItem(key, sessionValue);
          
          return parsed;
        } catch (e) {
          console.error('Error parsing sessionStorage value:', e);
        }
      }
      
      return null;
    } catch (e) {
      console.error('Error reading auth data:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: any) => {
    try {
      if (!value) {
        console.error('Attempting to store empty value for key:', key);
        return;
      }
      
      const valueString = JSON.stringify(value);
      
      // Store in localStorage for persistence across browser sessions
      localStorage.setItem(key, valueString);
      
      // Also store in sessionStorage for faster access
      sessionStorage.setItem(key, valueString);
      
      // Store a backup copy with a timestamp
      const timestamp = new Date().toISOString();
      localStorage.setItem(`${key}_timestamp`, timestamp);
      localStorage.setItem(`${key}_backup`, valueString);
      
      console.log(`Session stored at ${timestamp} for user: ${value?.user?.id || 'unknown'}`);
    } catch (e) {
      console.error('Error setting auth data:', e);
      
      // Emergency fallback - try to store a minimal version
      try {
        const minimalValue = JSON.stringify({
          user: value?.user ? { id: value.user.id } : null,
          expires_at: value?.expires_at
        });
        localStorage.setItem(`${key}_emergency`, minimalValue);
      } catch (backupError) {
        console.error('Emergency storage also failed:', backupError);
      }
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      localStorage.removeItem(`${key}_backup`);
      localStorage.removeItem(`${key}_emergency`);
      
      console.log('Session removed from all storage locations');
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

// Check if BroadcastChannel is supported by the browser
const isBroadcastChannelSupported = typeof BroadcastChannel !== 'undefined';

// Broadcast channel for cross-tab communication
const authChannel = isBroadcastChannelSupported 
  ? new BroadcastChannel('supabase_auth_channel') 
  : null;

// Setup cross-tab auth state synchronization
if (authChannel) {
  authChannel.onmessage = async (event) => {
    if (event.data?.type === 'SIGNED_IN' || event.data?.type === 'SESSION_UPDATE') {
      console.log('Received auth event from another tab:', event.data?.type);
      try {
        await supabase.auth.refreshSession();
        console.log('Session refreshed after event from another tab');
      } catch (error) {
        console.error('Error refreshing session after event:', error);
      }
    } else if (event.data?.type === 'SIGNED_OUT') {
      console.log('Received signout event from another tab');
      try {
        await supabase.auth.signOut({ scope: 'local' });
        console.log('Session cleared after signout event from another tab');
      } catch (error) {
        console.error('Error clearing session after signout event:', error);
      }
    }
  };
}

// Improve session state synchronization
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth state changed: ${event}`);
  
  if (event === 'SIGNED_IN' && session) {
    // Store session in our storage
    persistentStorage.setItem(STORAGE_KEY, session);
    
    // Broadcast sign in to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SIGNED_IN', 
        timestamp: Date.now(),
        userId: session.user.id 
      });
    }
    
    // Also use localStorage events for browsers without BroadcastChannel
    try {
      const loginEvent = { 
        type: 'SIGNED_IN', 
        userId: session.user.id, 
        timestamp: Date.now() 
      };
      localStorage.setItem('supabase_auth_event', JSON.stringify(loginEvent));
    } catch (error) {
      console.error('Error sending login event:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    persistentStorage.removeItem(STORAGE_KEY);
    
    // Broadcast sign out to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SIGNED_OUT', 
        timestamp: Date.now() 
      });
    }
    
    // Also use localStorage for browsers without BroadcastChannel
    try {
      const logoutEvent = { 
        type: 'SIGNED_OUT', 
        timestamp: Date.now() 
      };
      localStorage.setItem('supabase_auth_event', JSON.stringify(logoutEvent));
    } catch (error) {
      console.error('Error sending logout event:', error);
    }
  } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
    persistentStorage.setItem(STORAGE_KEY, session);
    
    // Broadcast update to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SESSION_UPDATE', 
        timestamp: Date.now(),
        userId: session.user.id
      });
    }
  }
});

// Periodic session check to prevent expiration
const setupSessionRefresh = () => {
  const interval = setInterval(async () => {
    try {
      // Only perform refresh when tab is visible
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // If session exists but expires in less than 5 minutes, refresh it
          const expiresAt = data.session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt - now < 300) {
            console.log('Session expiring soon, refreshing token');
            await supabase.auth.refreshSession();
            console.log('Session refreshed successfully');
            
            // Make sure it's stored properly
            persistentStorage.setItem(STORAGE_KEY, data.session);
          }
        }
      }
    } catch (error) {
      console.error('Error in session refresh:', error);
    }
  }, 60000); // Check every minute
  
  // Clear interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
  
  return interval;
};

// Set up session refresh
let refreshInterval = setupSessionRefresh();

// Safe method to get session from storage with fallbacks
export const getSessionFromStorage = () => {
  try {
    return persistentStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error getting session from storage:', e);
    return null;
  }
};

// Handle visibility change to check and refresh session
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('Tab became visible, checking session');
    
    try {
      // First check if we have a session in storage
      const storedSession = getSessionFromStorage();
      
      // Verify with API
      await supabase.auth.refreshSession();
      console.log('Session refreshed after tab visibility change');
    } catch (err) {
      console.error('Error during visibility session check:', err);
    }
  }
};

// Add visibility change handler
document.addEventListener('visibilitychange', handleVisibilityChange);

// Storage event listener for cross-tab communication
window.addEventListener('storage', (event) => {
  if (event.key === 'supabase_auth_event') {
    try {
      const eventData = JSON.parse(event.newValue || '{}');
      console.log('Storage event received:', eventData.type);
      
      if (eventData.type === 'SIGNED_IN') {
        // Force session refresh
        supabase.auth.refreshSession().catch(error => {
          console.error('Error refreshing after storage event:', error);
        });
      } else if (eventData.type === 'SIGNED_OUT') {
        // Clear session
        persistentStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error processing storage event:', error);
    }
  }
});

// Force a session sync on load
setTimeout(handleVisibilityChange, 1000);
