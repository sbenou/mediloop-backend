
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';

export interface LoyaltyStatus {
  points: number;
  level: string;
  nextLevel: string;
  nextLevelThreshold: number;
  percentToNextLevel: number;
  registeredDays: number;
  registeredYears: number;
  nextBadgeYears: number | null;
  walletBalance: number;
  availablePoints: number;
  totalPoints: number;
  currentLevel: string;
  yearsOfSeniority: number;
  professionalCredits?: number;
  discountRate?: number;
  marketingCredits?: number;
  freeDeliveries?: number;
  healthRewards?: number;
}

const DEFAULT_STATUS: LoyaltyStatus = {
  points: 0,
  level: 'Bronze',
  nextLevel: 'Silver',
  nextLevelThreshold: 1000,
  percentToNextLevel: 0,
  registeredDays: 0,
  registeredYears: 0,
  nextBadgeYears: 1,
  walletBalance: 0,
  availablePoints: 0,
  totalPoints: 0,
  currentLevel: 'bronze',
  yearsOfSeniority: 0,
  professionalCredits: 0,
  discountRate: 0,
  marketingCredits: 0,
  freeDeliveries: 0,
  healthRewards: 0
};

export const useLoyaltyStatus = (): LoyaltyStatus => {
  const { user } = useAuth();
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus>(DEFAULT_STATUS);

  useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .rpc('get_user_loyalty_status', {
            p_user_id: user.id
          });

        if (error) {
          console.error('Error fetching loyalty status:', error);
          return;
        }

        // Ensure we only set data if it's a valid LoyaltyStatus object
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setLoyaltyStatus(data as LoyaltyStatus);
        } else {
          setLoyaltyStatus(DEFAULT_STATUS);
        }
      } catch (err) {
        console.error('Error in useLoyaltyStatus:', err);
        setLoyaltyStatus(DEFAULT_STATUS);
      }
    };

    fetchLoyaltyStatus();
  }, [user?.id]);

  return loyaltyStatus;
};
