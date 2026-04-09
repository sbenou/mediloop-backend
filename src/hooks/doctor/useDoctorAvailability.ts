
import { useState, useEffect } from 'react';
import { fetchDoctorAvailabilityApi } from '@/services/clinicalApi';
import { UserProfile } from '@/types/user';

export const useDoctorAvailability = (userProfile: UserProfile | undefined) => {
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const checkDoctorAvailability = async () => {
      if (userProfile?.role === 'doctor' && userProfile?.id) {
        try {
          const now = new Date();
          const dayOfWeek = now.getDay();

          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

          const rows = await fetchDoctorAvailabilityApi(
            userProfile.id,
            'teleconsultation',
          );
          const data = rows.find((r) => r.day_of_week === dayOfWeek);

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
