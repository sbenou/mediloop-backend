import { useQuery } from "@tanstack/react-query";
import { fetchDoctorHomeApi } from "@/services/clinicalApi";

export interface DoctorStats {
  total_patients: number;
  active_teleconsultations: number;
  active_consultations: number;
  active_prescriptions: number;
  patient_trend?: Array<{ value: number }>;
  percent_change: number;
}

/** Shared cache key with useDoctorRecentPatients and doctor dashboard activities. */
export const DOCTOR_HOME_QUERY_KEY = ["doctor", "home"] as const;

export const useDoctorStats = (doctorId?: string) => {
  return useQuery({
    queryKey: [...DOCTOR_HOME_QUERY_KEY],
    queryFn: fetchDoctorHomeApi,
    select: (data): DoctorStats => ({
      total_patients: data.stats.total_patients,
      active_teleconsultations: data.stats.active_teleconsultations,
      active_consultations: data.stats.active_consultations,
      active_prescriptions: data.stats.active_prescriptions,
      percent_change: data.stats.percent_change,
    }),
    enabled: !!doctorId,
  });
};
