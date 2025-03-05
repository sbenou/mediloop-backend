import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create storage key based on project URL
const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Debug function to track storage operations
const logStorageOperation = (action: string, key: string, success: boolean, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%cStorage ${action}%c: ${key} | %c${success ? 'Success' : 'Failed'}`,
      'font-weight: bold; color: blue',
      'color: black',
      `color: ${success ? 'green' : 'red'}`
    );
    if (error) console.error('Error details:', error);
  }
};

// Enhanced storage that works better across tabs with browser storage events
const crossTabStorage = {
  getItem: (key: string) => {
    try {
      // Check both localStorage and sessionStorage in case one is corrupted
      let storedValue = null;
      
      // First try localStorage (for persistence)
      try {
        storedValue = window.localStorage.getItem(key);
        if (storedValue) {
          logStorageOperation('GET', key + ' (localStorage)', true);
        }
      } catch (e) {
        logStorageOperation('GET', key + ' (localStorage)', false, e);
      }
      
      // Then try sessionStorage as fallback
      if (!storedValue) {
        try {
          storedValue = window.sessionStorage.getItem(key);
          if (storedValue) {
            // If found in sessionStorage but not localStorage, restore it to localStorage
            logStorageOperation('GET', key + ' (sessionStorage)', true);
            try {
              window.localStorage.setItem(key, storedValue);
              logStorageOperation('SYNC', key + ' (localStorage <- sessionStorage)', true);
            } catch (syncError) {
              logStorageOperation('SYNC', key + ' (localStorage <- sessionStorage)', false, syncError);
            }
          }
        } catch (e) {
          logStorageOperation('GET', key + ' (sessionStorage)', false, e);
        }
      }
      
      if (!storedValue) {
        logStorageOperation('GET', key, false, 'No value found in any storage');
        return null;
      }
      
      // Parse the stored session
      try {
        const parsed = JSON.parse(storedValue);
        
        // Check if session is expired
        if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
          console.warn('Session has expired, removing from storage');
          crossTabStorage.removeItem(key);
          return null;
        }
        
        return parsed;
      } catch (parseError) {
        logStorageOperation('PARSE', key, false, parseError);
        return null;
      }
    } catch (e) {
      logStorageOperation('GET', key, false, e);
      console.error('Error reading auth data:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: any) => {
    try {
      // Don't store null or undefined values
      if (value === null || value === undefined) {
        logStorageOperation('SET', key, false, 'Attempted to store null/undefined value');
        return;
      }
      
      const valueString = JSON.stringify(value);
      
      // Store in localStorage for cross-tab persistence
      try {
        window.localStorage.setItem(key, valueString);
        logStorageOperation('SET', key + ' (localStorage)', true);
      } catch (e) {
        logStorageOperation('SET', key + ' (localStorage)', false, e);
        console.error('Error storing in localStorage:', e);
      }
      
      // Also store in sessionStorage as backup
      try {
        window.sessionStorage.setItem(key, valueString);
        logStorageOperation('SET', key + ' (sessionStorage)', true);
      } catch (e) {
        logStorageOperation('SET', key + ' (sessionStorage)', false, e);
        console.error('Error storing in sessionStorage:', e);
      }
      
      // Track when session was stored
      const timestamp = new Date().toISOString();
      try {
        window.localStorage.setItem(`${key}_timestamp`, timestamp);
      } catch (e) {
        console.error('Error storing timestamp:', e);
      }
      
      // Fire a custom event that can be listened for in other parts of the app
      try {
        const event = new CustomEvent('supabase:auth:token:update', { 
          detail: { 
            timestamp, 
            userId: value?.user?.id,
            expiresAt: value?.expires_at
          } 
        });
        window.dispatchEvent(event);
      } catch (eventError) {
        console.error('Error dispatching custom event:', eventError);
      }
      
      console.log(`Auth: Session stored at ${timestamp} for user: ${value?.user?.id || 'unknown'}`);
    } catch (e) {
      logStorageOperation('SET', key, false, e);
      console.error('Error setting auth data:', e);
    }
  },
  
  removeItem: (key: string) => {
    try {
      // Clear from localStorage
      try {
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(`${key}_timestamp`);
        logStorageOperation('REMOVE', key + ' (localStorage)', true);
      } catch (e) {
        logStorageOperation('REMOVE', key + ' (localStorage)', false, e);
      }
      
      // Clear from sessionStorage
      try {
        window.sessionStorage.removeItem(key);
        window.sessionStorage.removeItem(`${key}_timestamp`);
        logStorageOperation('REMOVE', key + ' (sessionStorage)', true);
      } catch (e) {
        logStorageOperation('REMOVE', key + ' (sessionStorage)', false, e);
      }
      
      console.log('Auth: Session removed from storage');
    } catch (e) {
      logStorageOperation('REMOVE', key, false, e);
      console.error('Error removing auth data:', e);
    }
  }
};

// Add a global method to help with debugging session storage
(window as any).clearAllSupabaseStorage = () => {
  try {
    // Clear all storage related to Supabase
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        localStorage.removeItem(key);
      }
    }
    
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionStorage.removeItem(key);
      }
    }
    
    // Enhanced cookie clearing - get all cookies
    const allCookies = document.cookie.split(';');
      
    // Clear each cookie with multiple domain/path combinations to ensure they're removable manually
    allCookies.forEach(cookie => {
      const name = cookie.trim().split('=')[0];
      if (!name) return;
      
      // Common paths that might have been set for auth cookies
      const paths = ['/', '/login', '/auth', '/dashboard', '/profile', '/api', ''];
      
      // Get the hostname parts for domain clearing
      const hostParts = window.location.hostname.split('.');
      const domains = [];
      
      // Add main domain
      domains.push(window.location.hostname);
      
      // Add parent domain if exists (for subdomains)
      if (hostParts.length > 2) {
        domains.push(`.${hostParts.slice(-2).join('.')}`);
      }
      
      // Add root domain with dot prefix
      domains.push(`.${window.location.hostname}`);
      
      // Add empty domain (current domain only)
      domains.push('');
      
      // Try clearing with all combinations of domain and path
      domains.forEach(domain => {
        paths.forEach(path => {
          // Multiple approaches to ensure cookie deletion
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0;`;
          
          // Use different timestamp formats
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0;`;
          
          // Try with and without secure flag
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0; secure;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0;`;
          
          // Set to empty with immediate expiration
          document.cookie = `${name}=; path=${path}${domain ? `; domain=${domain}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=-1;`;
          
          // Create without HttpOnly to allow manual clearing
          document.cookie = `${name}=; path=${path}${domain ? `; domain=${domain}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=-1;`;
        });
      });
      
      // For SameSite=None cookies
      paths.forEach(path => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; max-age=0; secure;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; max-age=0;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax; max-age=0;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict; max-age=0;`;
      });
      
      // Last resort: try without path or domain specification
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      
      // Try setting to an explicitly empty value
      document.cookie = `${name}=""; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      document.cookie = `${name}=''; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      
      // Try overwriting with value instead of deleting
      document.cookie = `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      
      // Add specific handling for cookies that might be using these specific attributes
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      document.cookie = `${name}=; max-age=0;`;
      document.cookie = `${name}=; max-age=-1;`;
      
      // Attempt to directly overwrite the cookie value
      document.cookie = `${name}=`;
    });
    
    console.log('%cAll Supabase storage cleared manually', 'color: green; font-weight: bold');
    return true;
  } catch (e) {
    console.error('Failed to clear Supabase storage:', e);
    return false;
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
      try {
        await supabase.auth.refreshSession();
        console.log('Auth: Session refreshed after signin event from another tab');
      } catch (error) {
        console.error('Auth: Error refreshing session after signin event:', error);
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
    } else if (event.data?.type === 'SESSION_REFRESHED') {
      console.log('Auth: Received session refresh event from another tab');
      try {
        // Just pull the latest session without forcing a refresh
        await supabase.auth.getSession();
      } catch (error) {
        console.error('Auth: Error getting session after refresh event:', error);
      }
    }
  };
}

// Improve session state synchronization across tabs
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth: State changed: ${event} for user: ${session?.user?.id || 'none'}`);
  
  // Force store the session on all auth events to ensure persistence
  if (session) {
    crossTabStorage.setItem(STORAGE_KEY, session);
    console.log(`Auth: Session explicitly stored after ${event} event`);
  }
  
  if (event === 'SIGNED_IN' && session) {
    // Broadcast signin to other tabs
    if (authChannel) {
      authChannel.postMessage({ type: 'SIGNED_IN', timestamp: Date.now(), userId: session.user.id });
    }
    
    // Also dispatch a window storage event for older browsers without BroadcastChannel
    try {
      const loginEvent = { type: 'LOGIN', userId: session.user.id, timestamp: Date.now() };
      localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
      // Force the storage event by removing and setting again
      localStorage.removeItem('last_auth_event');
      localStorage.setItem('last_auth_event', JSON.stringify(loginEvent));
    } catch (error) {
      console.error('Error sending login event via localStorage:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('Auth: User signed out, clearing storage');
    crossTabStorage.removeItem(STORAGE_KEY);
    
    // Broadcast signout to other tabs
    if (authChannel) {
      authChannel.postMessage({ type: 'SIGNED_OUT', timestamp: Date.now() });
    }
    
    // Also dispatch a window storage event for older browsers without BroadcastChannel
    try {
      const logoutEvent = { type: 'LOGOUT', timestamp: Date.now() };
      localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
      // Force the storage event by removing and setting again
      localStorage.removeItem('last_auth_event');
      localStorage.setItem('last_auth_event', JSON.stringify(logoutEvent));
    } catch (error) {
      console.error('Error sending logout event via localStorage:', error);
    }
  } else if (event === 'TOKEN_REFRESHED' && session) {
    // Broadcast token refresh to other tabs
    if (authChannel) {
      authChannel.postMessage({ 
        type: 'SESSION_REFRESHED', 
        timestamp: Date.now(), 
        userId: session.user.id 
      });
    }
    
    // Also dispatch an event via localStorage for browsers without BroadcastChannel
    try {
      const refreshEvent = { 
        type: 'TOKEN_REFRESHED',
        userId: session.user.id,
        timestamp: Date.now() 
      };
      localStorage.setItem('last_auth_event', JSON.stringify(refreshEvent));
      // Force the storage event
      localStorage.removeItem('last_auth_event');
      localStorage.setItem('last_auth_event', JSON.stringify(refreshEvent));
    } catch (error) {
      console.error('Error sending refresh event via localStorage:', error);
    }
  }
});

// Enhanced periodic session check with more aggressive refresh on visibility change
const setupSessionRefresh = () => {
  // Check session every 15 seconds when tab is visible
  const interval = window.setInterval(async () => {
    try {
      // Only perform refresh when tab is visible to avoid unnecessary API calls
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If session exists but expires in less than 5 minutes, refresh it
          const expiresAt = session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt - now < 300) {
            console.log('Auth: Session expiring soon, refreshing token');
            await supabase.auth.refreshSession();
            console.log('Auth: Session refreshed successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error in session refresh:', error);
    }
  }, 15000); // 15 seconds
  
  // Clear interval on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
  
  return interval;
};

// Initial session setup with more frequent refresh
let refreshInterval: number | null = null;

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
          console.log('Auth: Session refreshed successfully on visibility change');
          crossTabStorage.setItem(STORAGE_KEY, data.session);
        }
      }
      
      // Set up session refresh with increased frequency
      refreshInterval = setupSessionRefresh();
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
    // Try localStorage first (more persistent)
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      logStorageOperation('READ', 'localStorage', true);
      try {
        // Validate that the data is a valid session
        const parsed = JSON.parse(localData);
        if (parsed?.user?.id && parsed?.access_token) {
          // Also sync to sessionStorage for redundancy
          try {
            sessionStorage.setItem(STORAGE_KEY, localData);
          } catch (e) {
            console.error('Error syncing to sessionStorage:', e);
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing localStorage session:', e);
      }
    }
    
    // Then try sessionStorage
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      logStorageOperation('READ', 'sessionStorage', true);
      try {
        // Validate that the data is a valid session
        const parsed = JSON.parse(sessionData);
        if (parsed?.user?.id && parsed?.access_token) {
          // Also sync back to localStorage for persistence
          try {
            localStorage.setItem(STORAGE_KEY, sessionData);
            logStorageOperation('SYNC', 'localStorage <- sessionStorage', true);
          } catch (e) {
            console.error('Error syncing to localStorage:', e);
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing sessionStorage session:', e);
      }
    }
    
    logStorageOperation('READ', 'both storages', false, 'No valid session found');
    return null;
  } catch (e) {
    logStorageOperation('READ', 'both storages', false, e);
    console.error('Error getting session from storage:', e);
    return null;
  }
};

// Function to sync session when tab becomes visible (more aggressive)
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('Auth: Tab became visible, checking session');
    try {
      // First check if we have a session in storage
      const storedSession = getSessionFromStorage();
      
      if (storedSession) {
        console.log('Auth: Found stored session, verifying with API');
        // We have a session in storage, verify it with the API
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Auth: Session refresh failed on visibility change:', error);
          // Try to get current session without refreshing
          const { data: currentData } = await supabase.auth.getSession();
          if (currentData.session) {
            console.log('Auth: Got current session after refresh failure');
            crossTabStorage.setItem(STORAGE_KEY, currentData.session);
          }
        } else if (data.session) {
          console.log('Auth: Session refreshed successfully on visibility change');
          crossTabStorage.setItem(STORAGE_KEY, data.session);
        }
      } else {
        console.log('Auth: No stored session found on visibility change');
        // No session in storage, try to get current session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Auth: Found API session on visibility change');
          crossTabStorage.setItem(STORAGE_KEY, data.session);
        }
      }
    } catch (err) {
      console.error('Auth: Error during visibility session check:', err);
    }
  }
};

// Add visibility change handler for session syncing
document.addEventListener('visibilitychange', handleVisibilityChange);

// New function to repair storage inconsistencies
const repairStorageConsistency = () => {
  try {
    // First check localStorage
    const localData = localStorage.getItem(STORAGE_KEY);
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    
    if (localData && !sessionData) {
      // Session in localStorage but not sessionStorage, sync to sessionStorage
      sessionStorage.setItem(STORAGE_KEY, localData);
      console.log('Auth: Repaired missing sessionStorage data');
    } else if (!localData && sessionData) {
      // Session in sessionStorage but not localStorage, sync to localStorage
      localStorage.setItem(STORAGE_KEY, sessionData);
      console.log('Auth: Repaired missing localStorage data');
    } else if (localData && sessionData && localData !== sessionData) {
      // Both storages have different data, use the newer one
      try {
        const localParsed = JSON.parse(localData);
        const sessionParsed = JSON.parse(sessionData);
        
        // Compare expiry times to determine which is newer
        if ((localParsed.expires_at || 0) > (sessionParsed.expires_at || 0)) {
          sessionStorage.setItem(STORAGE_KEY, localData);
          console.log('Auth: Repaired inconsistent storage (used localStorage)');
        } else {
          localStorage.setItem(STORAGE_KEY, sessionData);
          console.log('Auth: Repaired inconsistent storage (used sessionStorage)');
        }
      } catch (e) {
        console.error('Error comparing storage data:', e);
      }
    }
  } catch (e) {
    console.error('Error repairing storage consistency:', e);
  }
};

// Add the repair function to page load
window.addEventListener('load', repairStorageConsistency);

// Also run repair on first load
repairStorageConsistency();

// Force a session sync on first load after a delay
setTimeout(handleVisibilityChange, 500);

// Export a function to completely clear all auth storage
export const clearAllAuthStorage = () => {
  try {
    // Clear all storage related to Supabase
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        localStorage.removeItem(key);
      }
    }
    
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionStorage.removeItem(key);
      }
    }
    
    // Enhanced cookie clearing - get all cookies
    const allCookies = document.cookie.split(';');
      
    // Clear each cookie with multiple domain/path combinations to ensure they're removable manually
    allCookies.forEach(cookie => {
      const name = cookie.trim().split('=')[0];
      if (!name) return;
      
      // Common paths that might have been set for auth cookies
      const paths = ['/', '/login', '/auth', '/dashboard', '/profile', '/api', ''];
      
      // Get the hostname parts for domain clearing
      const hostParts = window.location.hostname.split('.');
      const domains = [];
      
      // Add main domain
      domains.push(window.location.hostname);
      
      // Add parent domain if exists (for subdomains)
      if (hostParts.length > 2) {
        domains.push(`.${hostParts.slice(-2).join('.')}`);
      }
      
      // Add root domain with dot prefix
      domains.push(`.${window.location.hostname}`);
      
      // Add empty domain (current domain only)
      domains.push('');
      
      // Try clearing with all combinations of domain and path
      domains.forEach(domain => {
        paths.forEach(path => {
          // Multiple approaches to ensure cookie deletion
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0;`;
          
          // Use different timestamp formats
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0;`;
          
          // Try with and without secure flag
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0; secure;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; max-age=0;`;
          
          // Set to empty with immediate expiration
          document.cookie = `${name}=; path=${path}${domain ? `; domain=${domain}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=-1;`;
          
          // Create without HttpOnly to allow manual clearing
          document.cookie = `${name}=; path=${path}${domain ? `; domain=${domain}` : ''}; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=-1;`;
        });
      });
      
      // For SameSite=None cookies
      paths.forEach(path => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; max-age=0; secure;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=None; max-age=0;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax; max-age=0;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Strict; max-age=0;`;
      });
      
      // Last resort: try without path or domain specification
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      
      // Try setting to an explicitly empty value
      document.cookie = `${name}=""; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      document.cookie = `${name}=''; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      
      // Try overwriting with value instead of deleting
      document.cookie = `${name}=deleted; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
      
      // Add specific handling for cookies that might be using these specific attributes
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      document.cookie = `${name}=; max-age=0;`;
      document.cookie = `${name}=; max-age=-1;`;
      
      // Attempt to directly overwrite the cookie value
      document.cookie = `${name}=`;
    });
    
    console.log('%cAll Supabase storage cleared manually', 'color: green; font-weight: bold');
    return true;
  } catch (e) {
    console.error('Failed to clear Supabase storage:', e);
    return false;
  }
};
