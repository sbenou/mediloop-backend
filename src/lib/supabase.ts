import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create storage key based on project URL
const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Improved session storage with robust error handling and timestamp tracking
const enhancedStorage = {
  getItem: (key: string) => {
    try {
      // Try localStorage first (persistent across sessions)
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        const parsed = JSON.parse(storedValue);
        
        // Check if session is expired
        if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
          console.log('Auth: Session expired, removing from storage');
          enhancedStorage.removeItem(key);
          return null;
        }
        
        // Also sync to sessionStorage for faster access
        try {
          window.sessionStorage.setItem(key, storedValue);
        } catch (syncError) {
          console.error('Error syncing to sessionStorage:', syncError);
        }
        
        return parsed;
      }
      
      // If not in localStorage, try sessionStorage as fallback
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
      if (!value) {
        console.error('Attempting to store empty value for key:', key);
        return;
      }
      
      const valueString = JSON.stringify(value);
      
      // Store in localStorage for persistence across sessions
      window.localStorage.setItem(key, valueString);
      
      // Store in sessionStorage for faster access
      window.sessionStorage.setItem(key, valueString);
      
      // Track when session was stored
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(`${key}_timestamp`, timestamp);
      
      // Store a duplicate copy with a backup key in case the original gets corrupted
      window.localStorage.setItem(`${key}_backup`, valueString);
      
      // Fire a custom event that can be listened for in other parts of the app
      try {
        const event = new CustomEvent('supabase:auth:update', { 
          detail: { 
            timestamp, 
            userId: value?.user?.id, 
            type: 'session_updated' 
          } 
        });
        window.dispatchEvent(event);
      } catch (eventError) {
        console.error('Error dispatching custom event:', eventError);
      }
      
      console.log(`Auth: Session stored at ${timestamp} for user: ${value?.user?.id || 'unknown'}`);
    } catch (e) {
      console.error('Error setting auth data:', e);
      
      // Emergency fallback
      try {
        console.log('Attempting emergency session storage');
        const simpleValue = JSON.stringify({
          user: value?.user ? { id: value.user.id } : null,
          expires_at: value?.expires_at
        });
        window.localStorage.setItem(`${key}_emergency`, simpleValue);
      } catch (backupError) {
        console.error('Emergency storage also failed:', backupError);
      }
    }
  },
  
  removeItem: (key: string) => {
    try {
      // Remove from all storage locations
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(`${key}_timestamp`);
      window.localStorage.removeItem(`${key}_backup`);
      window.localStorage.removeItem(`${key}_emergency`);
      
      // Fire a custom event to notify other components
      const event = new CustomEvent('supabase:auth:update', { 
        detail: { 
          timestamp: new Date().toISOString(), 
          type: 'session_removed' 
        } 
      });
      window.dispatchEvent(event);
      
      console.log('Auth: Session removed from all storage');
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
    storage: enhancedStorage,
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

// Broadcast channel for cross-tab communication about auth state
const authChannel = isBroadcastChannelSupported 
  ? new BroadcastChannel('supabase_auth_channel') 
  : null;

// Setup cross-tab auth state synchronization with retries and backoff
if (authChannel) {
  // Listen for auth state changes from other tabs
  authChannel.onmessage = async (event) => {
    if (event.data?.type === 'SIGNED_IN' || event.data?.type === 'SESSION_UPDATE') {
      console.log('Auth: Received auth event from another tab:', event.data?.type);
      // Force refresh the session
      try {
        await supabase.auth.refreshSession();
        console.log('Auth: Session refreshed after event from another tab');
      } catch (error) {
        console.error('Auth: Error refreshing session after event:', error);
        
        // Retry with exponential backoff
        const retry = async (attempt = 0, maxAttempts = 3) => {
          if (attempt >= maxAttempts) return;
          
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Auth: Retrying session refresh in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
          
          setTimeout(async () => {
            try {
              await supabase.auth.refreshSession();
              console.log('Auth: Session refreshed successfully on retry');
            } catch (retryError) {
              console.error(`Auth: Retry ${attempt + 1} failed:`, retryError);
              retry(attempt + 1, maxAttempts);
            }
          }, delay);
        };
        
        retry();
      }
    } else if (event.data?.type === 'SIGNED_OUT') {
      console.log('Auth: Received signout event from another tab');
      // Clear local session
      try {
        await supabase.auth.signOut({ scope: 'local' });
        console.log('Auth: Session cleared after signout event from another tab');
        // Force reload to ensure UI is in sync
        window.location.reload();
      } catch (error) {
        console.error('Auth: Error clearing session after signout event:', error);
      }
    }
  };
}

// Improve session state synchronization with better error handling and retries
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth: State changed: ${event} for user: ${session?.user?.id || 'none'}`);
  
  if (event === 'SIGNED_IN' && session) {
    // Store session in our enhanced storage
    enhancedStorage.setItem(STORAGE_KEY, session);
    console.log('Auth: Session stored after sign in');
    
    // Broadcast signin to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SIGNED_IN', 
        timestamp: Date.now(), 
        userId: session.user.id 
      });
    }
    
    // Also dispatch window events for browsers without BroadcastChannel
    try {
      // Use both storage event and custom event for maximum compatibility
      const loginEvent = { 
        type: 'SIGNED_IN', 
        userId: session.user.id, 
        timestamp: Date.now() 
      };
      
      // Store in localStorage to trigger storage events in other tabs
      localStorage.setItem('supabase_auth_event', JSON.stringify(loginEvent));
      
      // Custom event for same-tab components
      window.dispatchEvent(new CustomEvent('supabase:auth:signed_in', { 
        detail: loginEvent 
      }));
    } catch (error) {
      console.error('Error sending login event:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('Auth: User signed out, clearing storage');
    enhancedStorage.removeItem(STORAGE_KEY);
    
    // Broadcast signout to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SIGNED_OUT', 
        timestamp: Date.now() 
      });
    }
    
    // Also dispatch window events for browsers without BroadcastChannel
    try {
      const logoutEvent = { 
        type: 'SIGNED_OUT', 
        timestamp: Date.now() 
      };
      localStorage.setItem('supabase_auth_event', JSON.stringify(logoutEvent));
      
      window.dispatchEvent(new CustomEvent('supabase:auth:signed_out', { 
        detail: logoutEvent 
      }));
    } catch (error) {
      console.error('Error sending logout event:', error);
    }
  } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
    console.log(`Auth: ${event}, updating storage`);
    enhancedStorage.setItem(STORAGE_KEY, session);
    
    // Broadcast update to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SESSION_UPDATE', 
        timestamp: Date.now(),
        userId: session.user.id
      });
    }
    
    // Custom event for same-tab components
    try {
      window.dispatchEvent(new CustomEvent('supabase:auth:updated', { 
        detail: { 
          type: event, 
          userId: session.user.id, 
          timestamp: Date.now() 
        } 
      }));
    } catch (error) {
      console.error('Error sending update event:', error);
    }
  }
});

// Enhanced periodic session check to prevent expiration with better error handling
const setupSessionRefresh = () => {
  // Check session every 30 seconds (reduced from 4 minutes)
  const interval = window.setInterval(async () => {
    try {
      // Only perform refresh when tab is visible to avoid unnecessary API calls
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // If session exists but expires in less than 5 minutes, refresh it
          const expiresAt = data.session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt - now < 300) {
            console.log('Auth: Session expiring soon, refreshing token');
            await supabase.auth.refreshSession();
            console.log('Auth: Session refreshed successfully');
            
            // Make sure it's stored properly
            enhancedStorage.setItem(STORAGE_KEY, data.session);
          }
        }
      }
    } catch (error) {
      console.error('Error in session refresh:', error);
    }
  }, 30000); // 30 seconds
  
  // Clear interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
  
  return interval;
};

// Initial session setup with more frequent refresh
let refreshInterval: number | null = null;

// Perform initial session check and setup
(async () => {
  try {
    // First try to get session from storage (faster)
    const storedSession = enhancedStorage.getItem(STORAGE_KEY);
    
    if (storedSession) {
      console.log(`Auth: Found session in storage for: ${storedSession.user?.id || 'unknown'}`);
    }
    
    // Get current session state from API
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log(`Auth: Initial session loaded for: ${session.user.id}`);
      // Make sure it's properly stored
      enhancedStorage.setItem(STORAGE_KEY, session);
      
      // Check and refresh token if needed
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt - now < 600) { // Less than 10 minutes left
        console.log('Auth: Session token expiring soon, refreshing...');
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          console.log('Auth: Session refreshed successfully');
          enhancedStorage.setItem(STORAGE_KEY, data.session);
        }
      }
      
      // Set up session refresh with increased frequency
      refreshInterval = setupSessionRefresh();
    } else {
      console.log('Auth: No initial session found');
      // Clear any potentially stale session data
      enhancedStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error during initial session check:', error);
    // Still set up refresh interval to retry automatically
    refreshInterval = setupSessionRefresh();
  }
})();

// Safe method to get session from storage with fallbacks
export const getSessionFromStorage = () => {
  try {
    // First try our enhanced storage (handles expiration checks)
    const sessionData = enhancedStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      return sessionData;
    }
    
    // Fallback to direct sessionStorage check
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        
        // Check for expiration
        if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
          console.log('Auth: Expired session found in fallback check, removing');
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
          return null;
        }
        
        return parsed;
      } catch (e) {
        console.error('Error parsing session data:', e);
      }
    }
    
    // Try backup locations as last resort
    const backupData = localStorage.getItem(`${STORAGE_KEY}_backup`);
    if (backupData) {
      try {
        return JSON.parse(backupData);
      } catch (e) {
        console.error('Error parsing backup session data:', e);
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error getting session from storage:', e);
    return null;
  }
};

// Enhanced visibility change handler with error handling and retries
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('Auth: Tab became visible, checking session');
    
    try {
      // First check if we have a session in storage
      const storedSession = getSessionFromStorage();
      if (storedSession?.user?.id) {
        console.log(`Auth: Found stored session for user: ${storedSession.user.id}`);
      }
      
      // Verify with API and refresh if needed
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        console.log('Auth: Session verification failed after tab visibility change:', error);
        // Clear stale data
        if (!data.session) {
          enhancedStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.log('Auth: Session verified after tab visibility change');
        // Ensure session is stored correctly
        enhancedStorage.setItem(STORAGE_KEY, data.session);
        
        // Notify other components in this tab
        window.dispatchEvent(new CustomEvent('supabase:auth:refreshed', { 
          detail: {
            userId: data.session.user.id,
            timestamp: Date.now()
          }
        }));
      }
    } catch (err) {
      console.error('Auth: Error during visibility session check:', err);
      
      // Retry once after a delay
      setTimeout(async () => {
        try {
          console.log('Auth: Retrying session check after error');
          await supabase.auth.refreshSession();
        } catch (retryErr) {
          console.error('Auth: Retry also failed:', retryErr);
        }
      }, 2000);
    }
  }
};

// Add visibility change handler for session syncing
document.addEventListener('visibilitychange', handleVisibilityChange);

// Storage event listener for cross-tab communication
window.addEventListener('storage', (event) => {
  if (event.key === 'supabase_auth_event') {
    try {
      const eventData = JSON.parse(event.newValue || '{}');
      console.log('Auth: Storage event received:', eventData.type);
      
      if (eventData.type === 'SIGNED_IN') {
        // Force session refresh
        supabase.auth.refreshSession().then(() => {
          console.log('Auth: Session refreshed after storage signin event');
        }).catch(error => {
          console.error('Auth: Error refreshing after storage event:', error);
        });
      } else if (eventData.type === 'SIGNED_OUT') {
        // Clear session and reload
        enhancedStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      }
    } catch (error) {
      console.error('Auth: Error processing storage event:', error);
    }
  }
});

// Force a session sync on first load
setTimeout(handleVisibilityChange, 500);

// Force another check 5 seconds after load (helps with race conditions)
setTimeout(handleVisibilityChange, 5000);

// Export the auth channel for components that need to use it directly
export const getAuthChannel = () => authChannel;

// Export the enhancedStorage for components that need direct access
export const getEnhancedStorage = () => enhancedStorage;
