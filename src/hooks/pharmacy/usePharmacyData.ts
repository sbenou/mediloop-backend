
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { WeekHours } from '@/types/pharmacy/hours';

export const usePharmacyData = (userProfile: UserProfile | undefined) => {
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  // Function to check if current time is within pharmacy opening hours
  const checkPharmacyAvailability = (hoursString: string) => {
    try {
      let hours: Partial<WeekHours>;
      try {
        hours = JSON.parse(hoursString);
      } catch (e) {
        console.error("Error parsing pharmacy hours:", e);
        setIsAvailable(false);
        return;
      }
      
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      if (hours && hours[currentDay as keyof WeekHours]) {
        const dayHours = hours[currentDay as keyof WeekHours];
        
        if (!dayHours || (dayHours as any).open === false) {
          setIsAvailable(false);
          return;
        }
        
        const openTime = (dayHours as any).openTime;
        const closeTime = (dayHours as any).closeTime;
        
        if (openTime && closeTime) {
          setIsAvailable(currentTime >= openTime && currentTime <= closeTime);
        } else {
          setIsAvailable(false);
        }
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      console.error("Error checking pharmacy availability:", error);
      setIsAvailable(false);
    }
  };

  useEffect(() => {
    const fetchPharmacyData = async () => {
      if (userProfile?.role === 'pharmacist' && userProfile?.id) {
        try {
          // First check if pharmacy name is already in the profile
          if (userProfile.pharmacy_name) {
            setPharmacyName(userProfile.pharmacy_name);
            return;
          }
          
          // Get the pharmacy_id from user_pharmacies
          const { data: pharmacyRelation, error: relationError } = await supabase
            .from('user_pharmacies')
            .select('pharmacy_id')
            .eq('user_id', userProfile.id)
            .single();

          if (relationError || !pharmacyRelation?.pharmacy_id) {
            console.error('Error fetching pharmacy relation:', relationError);
            return;
          }

          // Get pharmacy details
          const { data: pharmacy, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('name, hours')
            .eq('id', pharmacyRelation.pharmacy_id)
            .single();

          if (pharmacyError || !pharmacy) {
            console.error('Error fetching pharmacy:', pharmacyError);
            return;
          }

          setPharmacyName(pharmacy.name);
          
          if (pharmacy.hours) {
            checkPharmacyAvailability(pharmacy.hours);
          }
        } catch (error) {
          console.error('Error in fetchPharmacyData:', error);
        }
      }
    };

    fetchPharmacyData();
  }, [userProfile]);

  return { pharmacyName, isAvailable };
};
