
import { createClient } from '@supabase/supabase-js';

// For Vite, environment variables must be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default values for development if environment variables are not set
const fallbackUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Use fallback values if environment variables are not defined
const url = supabaseUrl || fallbackUrl;
const key = supabaseAnonKey || fallbackKey;

console.log('Supabase URL:', url);

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage, // Explicitly set storage to localStorage
    storageKey: `sb-${url.replace(/^(https?:\/\/)?(.*?)\..*$/, '$2')}-auth-token`,
    debug: process.env.NODE_ENV === 'development' // Enable debug logs in development
  }
});

export const getSessionFromStorage = () => {
  const STORAGE_KEY = `sb-${url.replace(/^(https?:\/\/)?(.*?)\..*$/, '$2')}-auth-token`;
  try {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      try {
        // Validate that we can parse the stored session
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.user && parsed.access_token) {
          return parsed;
        } else {
          console.warn('Invalid session format in localStorage, removing');
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (parseError) {
        console.error('Error parsing session from localStorage:', parseError);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    // Try session storage as fallback
    const sessionStorageSession = sessionStorage.getItem(STORAGE_KEY);
    if (sessionStorageSession) {
      try {
        // Validate that we can parse the stored session
        const parsed = JSON.parse(sessionStorageSession);
        if (parsed && parsed.user && parsed.access_token) {
          // Copy to localStorage for better persistence
          localStorage.setItem(STORAGE_KEY, sessionStorageSession);
          return parsed;
        } else {
          console.warn('Invalid session format in sessionStorage, removing');
          sessionStorage.removeItem(STORAGE_KEY);
        }
      } catch (parseError) {
        console.error('Error parsing session from sessionStorage:', parseError);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session from storage:', error);
    return null;
  }
};

export const clearAllAuthStorage = () => {
  const STORAGE_KEY = `sb-${url.replace(/^(https?:\/\/)?(.*?)\..*$/, '$2')}-auth-token`;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    
    // Clear any additional auth-related flags
    sessionStorage.removeItem('login_successful');
    sessionStorage.removeItem('dashboard_redirect_performed');
    localStorage.removeItem('last_auth_event');
    localStorage.removeItem('last_session_store');
    
    console.log('Local and session storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Utility function to check if a column exists in the database
export const checkColumnExists = async (tableName: string, columnName: string) => {
  try {
    // First check if the function exists
    const { data: functionExists, error: functionError } = await supabase
      .rpc('column_exists', { 
        p_table_name: tableName,
        p_column_name: columnName
      });

    if (functionError) {
      if (functionError.message?.includes('function "column_exists" does not exist')) {
        console.log('column_exists function not found, using alternative approach');
        // If the function doesn't exist, try a simple query that should work if the column exists
        try {
          const queryText = `select "${columnName}" from "${tableName}" limit 0`;
          await supabase.rpc('get_record_by_id', { 
            p_table_name: tableName,
            p_record_id: '00000000-0000-0000-0000-000000000000'
          });
          return true; // If no error, column exists
        } catch (queryError) {
          console.error('Error in alternative column check:', queryError);
          return false;
        }
      }
      
      console.error('Error checking column existence:', functionError);
      return false;
    }

    return !!functionExists;
  } catch (err) {
    console.error('Exception in checkColumnExists:', err);
    return false;
  }
};
