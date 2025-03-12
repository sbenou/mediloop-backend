
import { supabase, getSessionFromStorage } from '@/lib/supabase';
import { UserProfile } from '@/types/user';

/**
 * Fetches user permissions from the database based on role ID
 */
export const fetchUserPermissions = async (roleId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (id, name)
      `)
      .eq('role_id', roleId);

    if (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }

    return (data ?? []).map(rp => rp.permission_id);
  } catch (error) {
    console.error('Error in fetchUserPermissions:', error);
    return [];
  }
};

/**
 * Store session in localStorage and sessionStorage
 */
export const storeSession = (session: any) => {
  if (!session) return;
  
  const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    console.log(`Session explicitly stored for user: ${session.user.id}`);
  } catch (storageError) {
    console.error('Error storing session in storage:', storageError);
  }
};

/**
 * Broadcast an auth event to other tabs
 */
export const broadcastAuthEvent = (type: string, userId?: string) => {
  try {
    const event = { 
      type, 
      userId, 
      timestamp: Date.now() 
    };
    localStorage.setItem('last_auth_event', JSON.stringify(event));
    // Force the event to trigger
    localStorage.removeItem('last_auth_event');
    localStorage.setItem('last_auth_event', JSON.stringify(event));
  } catch (eventError) {
    console.error(`Error broadcasting ${type} event:`, eventError);
  }
};

/**
 * Clear all cookies
 */
export const clearAllCookies = () => {
  const allCookies = document.cookie.split(';');
  const domain = window.location.hostname;
  
  allCookies.forEach(cookie => {
    const name = cookie.trim().split('=')[0];
    if (!name) return;
    
    ["/", "/login", "/dashboard", "", "/api", "/auth", null].forEach(path => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'};`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path || '/'}; domain=${domain};`;
      document.cookie = `${name}=; max-age=-1; path=${path || '/'};`;
    });
    
    document.cookie = `${name}=; max-age=-1;`;
  });
};
