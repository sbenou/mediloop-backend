
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { safeSelectData } from '@/lib/typeUtils';

export function useSupabaseQuery<T>(
  key: string[],
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: Omit<UseQueryOptions<T, PostgrestError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await queryFn();
      return safeSelectData(data, error);
    },
    ...options,
  });
}
