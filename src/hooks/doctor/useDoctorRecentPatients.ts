import { useQuery } from "@tanstack/react-query";
import { fetchDoctorHomeApi } from "@/services/clinicalApi";
import { DOCTOR_HOME_QUERY_KEY } from "@/hooks/doctor/useDoctorStats";

export interface RecentPatientData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export const useDoctorRecentPatients = (doctorId: string | undefined) => {
  const q = useQuery({
    queryKey: [...DOCTOR_HOME_QUERY_KEY],
    queryFn: fetchDoctorHomeApi,
    select: (data): RecentPatientData[] =>
      (data.recent_patients ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
      })),
    enabled: !!doctorId,
  });

  return {
    recentPatients: q.data ?? [],
    loading: q.isLoading,
    error: q.error instanceof Error ? q.error : q.error ? new Error(String(q.error)) : null,
  };
};
