
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';

export const useDoctorAvailability = (userProfile: UserProfile | undefined) => {
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const checkDoctorAvailability = async () => {
      if (userProfile?.role === 'doctor' && userProfile?.id) {
        try {
          const now = new Date();
          const currentDay = now.getDay();
          const dayOfWeek = currentDay === 0 ? 7 : currentDay;
          
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          
          const { data, error } = await supabase
            .from('doctor_availability')
            .select('is_available, start_time, end_time')
            .eq('doctor_id', userProfile.id)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching doctor availability:', error);
            setIsAvailable(false);
            return;
          }
          
          if (data) {
            if (!data.is_available) {
              setIsAvailable(false);
              return;
            }
            
            if (data.start_time && data.end_time) {
              setIsAvailable(currentTime >= data.start_time && currentTime <= data.end_time);
            } else {
              setIsAvailable(true);
            }
          } else {
            setIsAvailable(false);
          }
        } catch (error) {
          console.error('Error checking doctor availability:', error);
          setIsAvailable(false);
        }
      }
    };

    checkDoctorAvailability();
  }, [userProfile]);

  return { isAvailable };
};
