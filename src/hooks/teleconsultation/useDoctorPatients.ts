
import { useState, useEffect } from "react";
import { fetchDoctorPatientConnectionsApi } from "@/services/clinicalApi";

export interface DoctorPatient {
  id: string;
  name: string;
  full_name: string | null;
  email: string | null;
  status?: string;
  connection_id?: string;
}

export const useDoctorPatients = (doctorId: string | undefined) => {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      setPatients([]);
      return;
    }

    const fetchPatients = async () => {
      try {
        setLoading(true);
        const rows = await fetchDoctorPatientConnectionsApi();
        const forDoctor = rows.filter((c) => c.doctor_id === doctorId);

        const list: DoctorPatient[] = forDoctor
          .filter((c) => c.patient)
          .map((c) => ({
            id: c.patient!.id,
            name: c.patient!.full_name ?? "Unknown Patient",
            full_name: c.patient!.full_name ?? "Unknown Patient",
            email: c.patient!.email,
            status: c.status,
            connection_id: c.id,
          }));

        setPatients(list);
        setError(null);
      } catch (err) {
        console.error("Error in useDoctorPatients:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [doctorId]);

  return { patients, loading, error };
};

export default useDoctorPatients;
