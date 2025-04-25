
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { WeekHours } from '@/types/pharmacy/hours';

export const usePharmacyData = (userProfile: UserProfile | undefined) => {
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
      if (!userProfile?.id) return;
      
      if (userProfile?.role !== 'pharmacist') {
        return;
      }
      
      setIsLoading(true);
      
      try {
        console.log("Fetching pharmacy data for user:", userProfile?.id);
        
        // First check if pharmacy name is already in the profile
        if (userProfile.pharmacy_name) {
          console.log("Using pharmacy name from profile:", userProfile.pharmacy_name);
          setPharmacyName(userProfile.pharmacy_name);
          setIsLoading(false);
          return;
        }
        
        // Set a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Pharmacy fetch timed out')), 5000);
        });
        
        // Get the pharmacy_id from user_pharmacies
        const pharmacyRelationPromise = supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', userProfile.id)
          .single();
          
        let pharmacyRelation;
        try {
          pharmacyRelation = await Promise.race([pharmacyRelationPromise, timeoutPromise]) as any;
        } catch (error) {
          console.error('Timed out fetching pharmacy relation:', error);
          setIsLoading(false);
          return;
        }
        
        if (pharmacyRelation.error || !pharmacyRelation.data?.pharmacy_id) {
          console.error('Error fetching pharmacy relation:', pharmacyRelation.error);
          setIsLoading(false);
          return;
        }

        // Get pharmacy details with another timeout
        const pharmacyPromise = supabase
          .from('pharmacies')
          .select('name, hours')
          .eq('id', pharmacyRelation.data.pharmacy_id)
          .single();
          
        let pharmacyResult;
        try {
          pharmacyResult = await Promise.race([pharmacyPromise, timeoutPromise]) as any;
        } catch (error) {
          console.error('Timed out fetching pharmacy details:', error);
          setIsLoading(false);
          return;
        }
        
        if (pharmacyResult.error || !pharmacyResult.data) {
          console.error('Error fetching pharmacy:', pharmacyResult.error);
          setIsLoading(false);
          return;
        }

        const pharmacy = pharmacyResult.data;
        console.log("Fetched pharmacy:", pharmacy);
        
        setPharmacyName(pharmacy.name);
        
        if (pharmacy.hours) {
          checkPharmacyAvailability(pharmacy.hours);
        }
        
        // Update the profile with the pharmacy name for future use
        if (pharmacy.name) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ pharmacy_name: pharmacy.name })
            .eq('id', userProfile.id);
            
          if (updateError) {
            console.error('Error updating profile with pharmacy name:', updateError);
          }
        }
      } catch (error) {
        console.error('Error in fetchPharmacyData:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPharmacyData();
  }, [userProfile]);

  return { pharmacyName, isAvailable, isLoading };
};
