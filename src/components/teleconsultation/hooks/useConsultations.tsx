
import { useState, useEffect } from "react";
import { Teleconsultation } from "@/types/supabase";
import { isPast, isFuture, isToday } from "date-fns";
import {
  fetchTeleconsultationsApi,
  fetchHasAcceptedDoctorApi,
} from "@/services/clinicalApi";

export const useConsultations = (
  profileId: string | undefined,
  filterRole?: string,
) => {
  const [consultations, setConsultations] = useState<Teleconsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState(true);

  const upcomingConsultations = consultations.filter(
    (c) => c.status === "confirmed" && isFuture(new Date(c.start_time)),
  );

  const todayConsultations = consultations.filter(
    (c) => c.status === "confirmed" && isToday(new Date(c.start_time)),
  );

  const pastConsultations = consultations.filter(
    (c) =>
      (c.status === "completed" || c.status === "confirmed") &&
      isPast(new Date(c.end_time)),
  );

  const pendingConsultations = consultations.filter(
    (c) => c.status === "pending",
  );

  const cancelledConsultations = consultations.filter(
    (c) => c.status === "cancelled",
  );

  useEffect(() => {
    const fetchConsultations = async () => {
      if (!profileId) return;

      setIsLoading(true);

      try {
        const typedConsultations = await fetchTeleconsultationsApi();
        setConsultations(typedConsultations);

        if (filterRole === "patient") {
          const hasDoc = await fetchHasAcceptedDoctorApi();
          setHasConnections(hasDoc);
        } else {
          setHasConnections(true);
        }
      } catch (err) {
        console.error("Error fetching teleconsultations:", err);
        setConsultations([]);
        if (filterRole === "patient") {
          setHasConnections(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultations();
  }, [profileId, filterRole]);

  return {
    isLoading,
    hasConnections,
    consultations,
    todayConsultations,
    upcomingConsultations,
    pastConsultations,
    pendingConsultations,
    cancelledConsultations,
  };
};
