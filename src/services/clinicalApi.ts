import { buildAuthHeaders } from "@/lib/activeContext";
import type { Teleconsultation } from "@/types/supabase";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

async function authHeaders(): Promise<HeadersInit> {
  return buildAuthHeaders({ "Content-Type": "application/json" });
}

export interface ApiPrescriptionRow {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string | null;
  status?: string;
  created_at: string;
  updated_at?: string;
  doctor_full_name?: string | null;
  patient_full_name?: string | null;
}

export async function fetchPrescriptionsApi(): Promise<ApiPrescriptionRow[]> {
  const res = await fetch(`${API_BASE}/api/prescriptions`, {
    method: "GET",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  const data = (await res.json()) as { prescriptions?: ApiPrescriptionRow[] };
  return data.prescriptions ?? [];
}

export async function fetchTeleconsultationsApi(): Promise<Teleconsultation[]> {
  const res = await fetch(`${API_BASE}/api/teleconsultations`, {
    method: "GET",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  const data = (await res.json()) as { consultations?: Teleconsultation[] };
  return data.consultations ?? [];
}

export async function fetchHasAcceptedDoctorApi(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/clinical/has-accepted-doctor`, {
    method: "GET",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    return false;
  }
  const data = (await res.json()) as { hasAcceptedDoctor?: boolean };
  return Boolean(data.hasAcceptedDoctor);
}
