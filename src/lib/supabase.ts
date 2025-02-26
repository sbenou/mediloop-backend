
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { safeQueryResult } from '@/types/user';

const supabaseUrl = 'https://hrrlefgnhkbzuwyklejj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U';

// Create storage key based on project URL
const STORAGE_KEY = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

// Define cookie storage adapter with secure defaults
const cookieStorage = {
  getItem: (key: string) => {
    try {
      const matches = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
      if (!matches) return null;
      
      const value = JSON.parse(decodeURIComponent(matches[1]));
      
      // Check if the stored session is expired
      if (value.expires_at && value.expires_at < Date.now() / 1000) {
        cookieStorage.removeItem(key);
        return null;
      }
      
      return value;
    } catch (e) {
      console.error('Error reading auth cookie:', e);
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      // Set expiration to match token expiration
      const expiresIn = value.expires_in || 3600; // Default to 1 hour if not provided
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + expiresIn);
      
      document.cookie = [
        `${key}=${encodeURIComponent(JSON.stringify(value))}`,
        `expires=${expires.toUTCString()}`,
        'path=/',
        'secure',
        'samesite=strict',
      ].join('; ');
    } catch (e) {
      console.error('Error setting auth cookie:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
    } catch (e) {
      console.error('Error removing auth cookie:', e);
    }
  }
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
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
    const { data,