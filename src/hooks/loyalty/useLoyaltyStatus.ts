import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

interface LoyaltyStatus {
  totalPoints: number;
  availablePoints: number;
  currentLevel: string;
  walletBalance: number;
  freeDeliveries: number;
  yearsOfSeniority: number;
  badge: string;
  badgeColor: string;
  nextBadgeYears: number | null;
  professionalCredits?: number;
  discountRate?: number;
  marketingCredits?: number;
  healthRewards?: number;
}

export function useLoyaltyStatus() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<LoyaltyStatus>({
    totalPoints: 0,
    availablePoints: 0,
    currentLevel: 'seedling',
    walletBalance: 0,
    freeDeliveries: 0,
    yearsOfSeniority: 0,
    badge: 'New Member',
    badgeColor: 'default',
    nextBadgeYears: 2
  });

  const fetchLoyaltyStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Check if the user_points table exists
      const { error: tableCheckError } = await supabase
        .from('user_points')
        .select('count(*)', { count: 'exact', head: true });
      
      // If the table doesn't exist, we'll use default values based on profile creation date
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log('user_points table does not exist, using default values');
        
        // Calculate years of seniority based on profile creation date
        const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
        const now = new Date();
        const yearsOfSeniority = Math.floor((now.getTime() - createdAt.getTime()) / (365 * 24 * 60 * 60 * 1000));
        
        // Determine badge based on years of seniority
        let badge = 'New Member';
        let badgeColor = 'default';
        let nextBadgeYears: number | null = 2 - yearsOfSeniority;
        
        if (yearsOfSeniority >= 8) {
          badge = 'Platinum Member';
          badgeColor = 'purple';
          nextBadgeYears = null; // No next badge
        } else if (yearsOfSeniority >= 7) {
          badge = 'Diamond Member';
          badgeColor = 'cyan';
          nextBadgeYears = 8 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 6) {
          badge = 'Gold Member';
          badgeColor = 'amber';
          nextBadgeYears = 7 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 5) {
          badge = 'Silver Member';
          badgeColor = 'gray';
          nextBadgeYears = 6 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 4) {
          badge = 'Bronze Member';
          badgeColor = 'orange';
          nextBadgeYears = 5 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 3) {
          badge = 'Senior Member';
          badgeColor = 'green';
          nextBadgeYears = 4 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 2) {
          badge = 'Loyal Member';
          badgeColor = 'blue';
          nextBadgeYears = 3 - yearsOfSeniority;
        }

        // Add role-specific loyalty benefits
        let roleSpecificData = {};
        if (profile?.role === 'doctor') {
          roleSpecificData = {
            professionalCredits: Math.round(50 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 25 : 0))
          };
        } else if (profile?.role === 'pharmacist') {
          roleSpecificData = {
            discountRate: Math.min(15, 5 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 2 : 0)),
            marketingCredits: Math.round(100 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 50 : 0))
          };
        } else {
          // Patient-specific benefits
          roleSpecificData = {
            healthRewards: Math.round(20 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 10 : 0))
          };
        }

        setStatus({
          totalPoints: 100 + yearsOfSeniority * 50,
          availablePoints: 50 + yearsOfSeniority * 25,
          currentLevel: yearsOfSeniority >= 3 ? 'wellness' : (yearsOfSeniority >= 1 ? 'blossom' : 'seedling'),
          walletBalance: 10 + yearsOfSeniority * 5,
          freeDeliveries: Math.min(5, 1 + Math.floor(yearsOfSeniority / 2)),
          yearsOfSeniority,
          badge,
          badgeColor,
          nextBadgeYears,
          ...roleSpecificData
        });
        
        return;
      }
      
      // If we got here, the table exists so we proceed with the query
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
        // Calculate years of seniority based on profile creation date
        const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
        const now = new Date();
        const yearsOfSeniority = Math.floor((now.getTime() - createdAt.getTime()) / (365 * 24 * 60 * 60 * 1000));
        
        // Determine badge based on years of seniority
        let badge = 'New Member';
        let badgeColor = 'default';
        let nextBadgeYears: number | null = 2 - yearsOfSeniority;
        
        if (yearsOfSeniority >= 8) {
          badge = 'Platinum Member';
          badgeColor = 'purple';
          nextBadgeYears = null; // No next badge
        } else if (yearsOfSeniority >= 7) {
          badge = 'Diamond Member';
          badgeColor = 'cyan';
          nextBadgeYears = 8 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 6) {
          badge = 'Gold Member';
          badgeColor = 'amber';
          nextBadgeYears = 7 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 5) {
          badge = 'Silver Member';
          badgeColor = 'gray';
          nextBadgeYears = 6 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 4) {
          badge = 'Bronze Member';
          badgeColor = 'orange';
          nextBadgeYears = 5 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 3) {
          badge = 'Senior Member';
          badgeColor = 'green';
          nextBadgeYears = 4 - yearsOfSeniority;
        } else if (yearsOfSeniority >= 2) {
          badge = 'Loyal Member';
          badgeColor = 'blue';
          nextBadgeYears = 3 - yearsOfSeniority;
        }

        // Add role-specific loyalty benefits
        let roleSpecificData = {};
        if (profile?.role === 'doctor') {
          roleSpecificData = {
            professionalCredits: Math.round(50 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 25 : 0))
          };
        } else if (profile?.role === 'pharmacist') {
          roleSpecificData = {
            discountRate: Math.min(15, 5 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 2 : 0)),
            marketingCredits: Math.round(100 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 50 : 0))
          };
        } else {
          // Patient-specific benefits
          roleSpecificData = {
            healthRewards: Math.round(20 + (yearsOfSeniority >= 2 ? (yearsOfSeniority - 1) * 10 : 0))
          };
        }

        setStatus({
          totalPoints: data.total_points,
          availablePoints: data.available_points,
          currentLevel: data.current_level,
          walletBalance: parseFloat(data.wallet_balance),
          freeDeliveries: data.free_deliveries_available,
          yearsOfSeniority,
          badge,
          badgeColor,
          nextBadgeYears,
          ...roleSpecificData
        });
      }
    } catch (err) {
      console.error('Error in useLoyaltyStatus:', err);
    }
  }, [user?.id, profile]);

  useEffect(() => {
    fetchLoyaltyStatus();
  }, [fetchLoyaltyStatus]);

  return status;
}
