
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = 'https://reaeyxplttbuejktjrdh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYWV5eHBsdHRidWVqa3RqcmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Legacy functions for backward compatibility
export const getSessionFromStorage = () => {
  return supabase.auth.getSession();
};

export const clearAllAuthStorage = async () => {
  await supabase.auth.signOut();
};
