
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
};

export const useLoyaltyStatus = (): LoyaltyStatus => {
  const { user } = useAuth();
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus>(DEFAULT_STATUS);

  useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!user?.id) return;

      try {
        // In a real app, this would be a query to your user_points table
        // Since we're getting errors about the table not existing,
        // we're returning mock data for now
        
        // Uncomment this when the table exists
        /*
        const { data, error } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching loyalty status:', error);
          return;
        }
        */
        
        // Mock data for UI development
        const mockData = {
          points: 750,
          level: 'Silver',
          next_level: 'Gold',
          next_level_threshold: 2000,
          registered_at: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
        };
        
        // Calculate days registered
        const registeredDate = new Date(mockData.registered_at);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate.getTime() - registeredDate.getTime());
        const registeredDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const registeredYears = registeredDays / 365;
        
        // Calculate next badge years (every 2 years)
        const yearsToNextBadge = Math.ceil(registeredYears / 2) * 2 - registeredYears;
        
        setLoyaltyStatus({
          points: mockData.points,
          level: mockData.level,
          nextLevel: mockData.next_level,
          nextLevelThreshold: mockData.next_level_threshold,
          percentToNextLevel: (mockData.points / mockData.next_level_threshold) * 100,
          registeredDays,
          registeredYears: Math.floor(registeredYears),
          nextBadgeYears: yearsToNextBadge > 0 ? Math.ceil(yearsToNextBadge) : null,
        });
      } catch (err) {
        console.error('Error in useLoyaltyStatus:', err);
      }
    };

    fetchLoyaltyStatus();
  }, [user?.id]);

  return loyaltyStatus;
};
