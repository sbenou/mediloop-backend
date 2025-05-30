
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import type { LocationPreference } from '@/types/luxembourg';

export const useLocationDetection = () => {
  const { profile } = useAuth();
  const [locationPreference, setLocationPreference] = useState<LocationPreference>({
    country: 'LU',
    isLuxembourg: true,
    detectedFromAddress: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectLocation = async () => {
      if (!profile?.id) return;

      try {
        setIsLoading(true);
        
        // First check user's stored country preference
        if (profile.country_preference) {
          setLocationPreference({
            country: profile.country_preference,
            isLuxembourg: profile.country_preference === 'LU',
            detectedFromAddress: false
          });
          return;
        }

        // If no preference, check user's address
        const { data: addresses } = await supabase
          .from('addresses')
          .select('country')
          .eq('user_id', profile.id)
          .eq('is_default', true)
          .limit(1);

        if (addresses && addresses.length > 0) {
          const addressCountry = addresses[0].country;
          setLocationPreference({
            country: addressCountry,
            isLuxembourg: addressCountry === 'LU',
            detectedFromAddress: true
          });

          // Save detected country as preference
          await supabase
            .from('profiles')
            .update({ country_preference: addressCountry })
            .eq('id', profile.id);
        }
      } catch (error) {
        console.error('Error detecting location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, [profile?.id, profile?.country_preference]);

  const updateCountryPreference = async (country: string) => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ country_preference: country })
        .eq('id', profile.id);

      setLocationPreference({
        country,
        isLuxembourg: country === 'LU',
        detectedFromAddress: false
      });
    } catch (error) {
      console.error('Error updating country preference:', error);
    }
  };

  return {
    locationPreference,
    isLoading,
    updateCountryPreference,
    isLuxembourg: locationPreference.isLuxembourg
  };
};
