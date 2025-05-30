
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
      if (!profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Check user's address to detect location
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
        } else {
          // Default to Luxembourg if no address found
          setLocationPreference({
            country: 'LU',
            isLuxembourg: true,
            detectedFromAddress: false
          });
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        // Default to Luxembourg on error
        setLocationPreference({
          country: 'LU',
          isLuxembourg: true,
          detectedFromAddress: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, [profile?.id]);

  const updateCountryPreference = async (country: string) => {
    if (!profile?.id) return;

    try {
      // Store the country preference in localStorage for now
      localStorage.setItem(`country_preference_${profile.id}`, country);

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
