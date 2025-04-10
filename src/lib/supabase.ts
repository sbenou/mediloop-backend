
import { createClient } from '@supabase/supabase-js';

// For Vite, environment variables must be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_STORYBOOK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_STORYBOOK_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Supabase URL is missing.');
}

if (!supabaseAnonKey) {
  console.error('Supabase Anon Key is missing.');
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const getSessionFromStorage = () => {
  const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
  try {
    const storedSession = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY);
    return storedSession ? JSON.parse(storedSession) : null;
  } catch (error) {
    console.error('Error getting session from storage:', error);
    return null;
  }
};

export const clearAllAuthStorage = () => {
  const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('Local and session storage cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Utility function to check if a column exists in the database
export const checkColumnExists = async (tableName: string, columnName: string) => {
  const { data, error } = await supabase
    .rpc('column_exists', { 
      p_table_name: tableName,
      p_column_name: columnName
    });

  if (error) {
    console.error('Error checking column existence:', error);
    return false;
  }

  return !!data;
};
