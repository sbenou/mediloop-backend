
import { useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { WeekHours } from "@/types/pharmacy/hours";
import { fetchPharmacyWorkspaceApi } from "@/services/professionalWorkspaceApi";

export const usePharmacyData = (userProfile: UserProfile | undefined) => {
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const checkPharmacyAvailability = (hoursString: string) => {
    try {
      let hours: Partial<WeekHours>;
      try {
        hours = JSON.parse(hoursString);
      } catch {
        setIsAvailable(false);
        return;
      }

      const now = new Date();
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const currentDay = dayNames[now.getDay()];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

      if (hours && hours[currentDay as keyof WeekHours]) {
        const dayHours = hours[currentDay as keyof WeekHours];

        if (!dayHours || (dayHours as { open?: boolean }).open === false) {
          setIsAvailable(false);
          return;
        }

        const openTime = (dayHours as { openTime?: string }).openTime;
        const closeTime = (dayHours as { closeTime?: string }).closeTime;

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
      if (!userProfile?.id || userProfile?.role !== "pharmacist") return;

      setIsLoading(true);

      try {
        if (userProfile.pharmacy_name) {
          setPharmacyName(userProfile.pharmacy_name);
          setIsLoading(false);
          return;
        }

        const pharmacy = await fetchPharmacyWorkspaceApi();
        setPharmacyName(pharmacy.name);

        if (pharmacy.hours) {
          checkPharmacyAvailability(pharmacy.hours);
        }
      } catch (error) {
        console.error("Error in fetchPharmacyData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPharmacyData();
  }, [userProfile]);

  return { pharmacyName, isAvailable, isLoading };
};
