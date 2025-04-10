
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
