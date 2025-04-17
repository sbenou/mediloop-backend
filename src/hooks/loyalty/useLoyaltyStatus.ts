
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

interface LoyaltyStatus {
  totalPoints: number;
  availablePoints: number;
  currentLevel: string;
  walletBalance: number;
  freeDeliveries: number;
}

export function useLoyaltyStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<LoyaltyStatus>({
    totalPoints: 0,
    availablePoints: 0,
    currentLevel: 'seedling',
    walletBalance: 0,
    freeDeliveries: 0
  });

  const fetchLoyaltyStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching loyalty status:', error);
        return;
      }

      if (data) {
        setStatus({
          totalPoints: data.total_points,
          availablePoints: data.available_points,
          currentLevel: data.current_level,
          walletBalance: parseFloat(data.wallet_balance),
          freeDeliveries: data.free_deliveries_available
        });
      }
    } catch (err) {
      console.error('Error in useLoyaltyStatus:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLoyaltyStatus();
  }, [fetchLoyaltyStatus]);

  return status;
}
