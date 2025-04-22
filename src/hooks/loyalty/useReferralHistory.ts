
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

interface Referral {
  id: string;
  referral_email: string;
  status: string;
  points_awarded: number;
  created_at: string;
  converted_at: string | null;
}

export function useReferralHistory() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReferrals = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // In a real app, this would be a query to your referrals table
      // Since we're getting errors about the table not existing,
      // we're returning mock data for now
      
      // Uncomment this when the table exists
      /*
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referrals:', error);
        return;
      }

      setReferrals(data || []);
      */
      
      // Mock data for UI development
      const mockReferrals: Referral[] = [
        {
          id: '1',
          referral_email: 'friend1@example.com',
          status: 'pending',
          points_awarded: 0,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          converted_at: null
        },
        {
          id: '2',
          referral_email: 'colleague@example.com',
          status: 'converted',
          points_awarded: 100,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          converted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          referral_email: 'friend2@example.com',
          status: 'converted',
          points_awarded: 100,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          converted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setReferrals(mockReferrals);
      
    } catch (err) {
      console.error('Error in useReferralHistory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return { referrals, isLoading };
}
