
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
    console.log(`[sessionUtils][DEBUG] Broadcasting auth event: ${eventType}`);
    localStorage.setItem('last_auth_event', JSON.stringify(event));
  } catch (error) {
    console.error("[sessionUtils][DEBUG] Error broadcasting auth event:", error);
  }
};

/**
 * Utility function to store session in both localStorage and sessionStorage
 * This ensures maximum persistence and compatibility
 */
export const storeSession = (session) => {
  if (!session) {
    console.warn("[sessionUtils][DEBUG] Attempted to store null/undefined session");
    return;
  }
  
  console.log("[sessionUtils][DEBUG] Storing session for user:", session.user.id);
  
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
    
    // Set flag for successful login - this will be used for redirection
    sessionStorage.setItem('login_successful', 'true');
    
    // Reset any redirection attempts or counters
    sessionStorage.removeItem('dashboard_redirect_count');
    sessionStorage.removeItem('dashboard_mount_count');
    sessionStorage.removeItem('pharmacy_redirect_count');
    
    // Log session details for debugging
    console.log("[sessionUtils][DEBUG] Session stored successfully", { 
      userId: session.user.id,
      expiresAt: session.expires_at,
      expiresIn: session.expires_in,
      storageKey: STORAGE_KEY,
      sessionKeys: Object.keys(session)
    });
    
    return true;
  } catch (error) {
    console.error("[sessionUtils][DEBUG] Error storing session:", error);
    return false;
  }
};

/**
 * Clear session data from storage
 */
export const clearSession = () => {
  try {
    console.log("[sessionUtils][DEBUG] Clearing session data");
    const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('last_session_store');
    
    // Also clear navigation flags
    sessionStorage.removeItem('login_successful');
    sessionStorage.removeItem('skip_dashboard_redirect');
    sessionStorage.removeItem('dashboard_redirect_count');
    sessionStorage.removeItem('dashboard_mount_count');
    sessionStorage.removeItem('pharmacy_redirect_count');
    
    return true;
  } catch (error) {
    console.error("[sessionUtils][DEBUG] Error clearing session:", error);
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
      console.log("[sessionUtils][DEBUG] Session not found in localStorage, checking sessionStorage");
      sessionStr = sessionStorage.getItem(STORAGE_KEY);
    }
    
    if (!sessionStr) {
      console.log("[sessionUtils][DEBUG] No session found in storage");
      return null;
    }
    
    const session = JSON.parse(sessionStr);
    console.log("[sessionUtils][DEBUG] Session retrieved from storage", { 
      userId: session.user?.id,
      expiresAt: session.expires_at,
      hasUser: !!session.user,
      sessionKeys: Object.keys(session)
    });
    
    return session;
  } catch (error) {
    console.error("[sessionUtils][DEBUG] Error getting session from storage:", error);
    return null;
  }
};

/**
 * Clear all cookies from the document
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
    
    console.log("[sessionUtils][DEBUG] All cookies cleared");
    return true;
  } catch (error) {
    console.error("[sessionUtils][DEBUG] Error clearing cookies:", error);
    return false;
  }
};

/**
 * Fetch user permissions from role_permissions table
 * @param roleId The role ID to fetch permissions for
 * @returns Array of permission strings
 */
export const fetchUserPermissions = async (roleId: string): Promise<string[]> => {
  try {
    console.log("[sessionUtils][DEBUG] Fetching permissions for role:", roleId);
    
    if (!roleId) {
      console.log("[sessionUtils][DEBUG] No role ID provided, returning empty permissions array");
      return [];
    }
    
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import('@/lib/supabase');
    
    // Fetch permissions from role_permissions table
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);
      
    if (error) {
      console.error("[sessionUtils][DEBUG] Error fetching permissions:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log("[sessionUtils][DEBUG] No permissions found for role:", roleId);
      return [];
    }
    
    // Extract permission IDs from the result
    const permissions = data.map(item => item.permission_id);
    
    console.log(`[sessionUtils][DEBUG] Found ${permissions.length} permissions for role ${roleId}`);
    
    return permissions;
  } catch (error) {
    console.error("[sessionUtils][DEBUG] Exception in fetchUserPermissions:", error);
    return [];
  }
};
