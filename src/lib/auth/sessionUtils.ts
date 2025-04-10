
/**
 * Broadcast authentication events to other tabs
 * @param eventType The type of auth event (LOGIN, LOGOUT, TOKEN_REFRESHED)
 */
export const broadcastAuthEvent = (eventType: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESHED') => {
  try {
    const event = {
      type: eventType,
      timestamp: Date.now()
    };
    localStorage.setItem('last_auth_event', JSON.stringify(event));
  } catch (error) {
    console.error("Error broadcasting auth event:", error);
  }
};

/**
 * Utility function to store session in both localStorage and sessionStorage
 * This ensures maximum persistence and compatibility
 */
export const storeSession = (session) => {
  if (!session) return;
  
  console.log("Session explicitly stored for user:", session.user.id);
  
  try {
    // Define the storage key in the Supabase format
    const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
    
    // Store in both storage types for maximum persistence
    const sessionStr = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, sessionStr);
    sessionStorage.setItem(STORAGE_KEY, sessionStr);
    
    // Also store a timestamp for when the session was last stored
    localStorage.setItem('last_session_store', Date.now().toString());
    
    // Broadcast login event to other tabs
    broadcastAuthEvent('LOGIN');
    
    return true;
  } catch (error) {
    console.error("Error storing session:", error);
    return false;
  }
};

/**
 * Clear session data from storage
 */
export const clearSession = () => {
  try {
    const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('last_session_store');
    return true;
  } catch (error) {
    console.error("Error clearing session:", error);
    return false;
  }
};

/**
 * Get session from storage
 */
export const getSessionFromStorage = () => {
  try {
    const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
    
    // Try localStorage first
    let sessionStr = localStorage.getItem(STORAGE_KEY);
    
    // Fall back to sessionStorage if needed
    if (!sessionStr) {
      sessionStr = sessionStorage.getItem(STORAGE_KEY);
    }
    
    if (!sessionStr) return null;
    
    return JSON.parse(sessionStr);
  } catch (error) {
    console.error("Error getting session from storage:", error);
    return null;
  }
};

/**
 * Clear all cookies from the document
 * This helps ensure complete logout
 */
export const clearAllCookies = () => {
  try {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Delete each cookie
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    
    console.log("All cookies cleared");
    return true;
  } catch (error) {
    console.error("Error clearing cookies:", error);
    return false;
  }
};
