
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Legacy functions for backward compatibility - make them synchronous
export const getSessionFromStorage = () => {
  try {
    const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const storedSession = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return storedSession ? JSON.parse(storedSession) : null;
  } catch {
    return null;
  }
};

export const clearAllAuthStorage = async () => {
  await supabase.auth.signOut();
};
