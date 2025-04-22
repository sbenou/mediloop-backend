
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
  subscription_purchased_at: string | null;
  referral_points_received: number;
}

export function useReferralHistory() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReferrals = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
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
