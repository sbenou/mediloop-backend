
import { PostgrestError } from '@supabase/supabase-js';

export type SupabaseResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export function isError<T>(response: SupabaseResponse<T>): response is { data: null; error: PostgrestError } {
  return !!response.error;
}

export function assertResponse<T>(response: SupabaseResponse<T>): T {
  if (isError(response)) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error('No data returned');
  }
  return response.data;
}

export function safeSelectData<T>(data: T | null, error: PostgrestError | null): T {
  if (error) throw error;
  if (!data) throw new Error('No data found');
  return data as T;
}
