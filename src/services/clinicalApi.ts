import { buildAuthHeaders } from "@/lib/activeContext";
import type { ConnectionStatus, Teleconsultation } from "@/types/clinical";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

async function authHeaders(): Promise<HeadersInit> {
  return buildAuthHeaders({ "Content-Type": "application/json" });
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}

async function requireOk<T extends { error?: string }>(
  res: Response,
  data: T,
): Promise<T> {
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data;
}

export interface ApiPrescriptionRow {
  id: string;
  doctor_id?: string;
  patient_id?: string;
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
  /** Patient-facing list/detail; omitted for doctor/pharmacist raw rows may still include tenant ids. */
  issued_by_workspace_name?: string | null;
  professional_tenant_id?: string | null;
  created_by_membership_id?: string | null;
}

export interface CreatePrescriptionInput {
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string | null;
  status?: "draft" | "active" | "completed";
}

export type UpdatePrescriptionInput = Partial<{
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
  status: "draft" | "active" | "completed";
}>;

export interface CreateTeleconsultationInput {
  patient_id: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
  room_id?: string | null;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
}

export type PatchTeleconsultationInput = Partial<{
  status: Teleconsultation["status"];
  reason: string;
  room_id: string;
  start_time: string;
  end_time: string;
}>;

export interface DoctorPatientConnectionRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  professional_tenant_id?: string | null;
  created_by_membership_id?: string | null;
  doctor?: {
    id: string;
    full_name: string;
    email: string | null;
    license_number?: string | null;
  };
  patient?: {
    id: string;
    full_name: string;
    email: string | null;
  };
}

export interface PlatformClinicalStats {
  prescriptions_count: number;
  teleconsultations_count: number;
  connections_count: number;
  orders_count: number;
  pharmacies_count: number;
  doctors_count: number;
}

/** Public aggregate counts (no auth). */
export async function fetchPlatformClinicalStatsApi(): Promise<PlatformClinicalStats> {
  const res = await fetch(`${API_BASE}/api/clinical/platform-stats`);
  const data = await parseJson<PlatformClinicalStats & { error?: string }>(res);
  await requireOk(res, data as { error?: string });
  return data;
}

export async function fetchPrescriptionByIdApi(
  id: string,
): Promise<ApiPrescriptionRow> {
  const res = await fetch(`${API_BASE}/api/prescriptions/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<{ prescription?: ApiPrescriptionRow; error?: string }>(
    res,
  );
  await requireOk(res, data);
  if (!data.prescription) throw new Error("Missing prescription in response");
  return data.prescription;
}

export async function deletePrescriptionApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/prescriptions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  const data = await parseJson<{ error?: string }>(res);
  await requireOk(res, data);
}

export async function fetchPrescriptionsApi(): Promise<ApiPrescriptionRow[]> {
  const res = await fetch(`${API_BASE}/api/prescriptions`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<{ prescriptions?: ApiPrescriptionRow[]; error?: string }>(
    res,
  );
  await requireOk(res, data);
  return data.prescriptions ?? [];
}

/** POST /api/prescriptions — doctor; requires active workspace (context headers). */
export async function createPrescriptionApi(
  body: CreatePrescriptionInput,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/prescriptions`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ prescription?: Record<string, unknown>; error?: string }>(
    res,
  );
  await requireOk(res, data);
  if (!data.prescription) throw new Error("Missing prescription in response");
  return data.prescription;
}

/** PUT /api/prescriptions/:id — doctor; tenant-scoped update. */
export async function updatePrescriptionApi(
  id: string,
  body: UpdatePrescriptionInput,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/prescriptions/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ prescription?: Record<string, unknown>; error?: string }>(
    res,
  );
  await requireOk(res, data);
  if (!data.prescription) throw new Error("Missing prescription in response");
  return data.prescription;
}

/**
 * List teleconsultations. Pass `forDoctorId` for pharmacist/staff calendar views
 * (backend enforces same workspace membership).
 */
export async function fetchTeleconsultationsApi(
  forDoctorId?: string,
): Promise<Teleconsultation[]> {
  const q =
    forDoctorId && forDoctorId.length > 0
      ? `?for_doctor_id=${encodeURIComponent(forDoctorId)}`
      : "";
  const res = await fetch(`${API_BASE}/api/teleconsultations${q}`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<{ consultations?: Teleconsultation[]; error?: string }>(
    res,
  );
  await requireOk(res, data);
  return data.consultations ?? [];
}

/** POST /api/teleconsultations — doctor; sets attribution from active context. */
export async function createTeleconsultationApi(
  body: CreateTeleconsultationInput,
): Promise<Teleconsultation> {
  const res = await fetch(`${API_BASE}/api/teleconsultations`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ consultation?: Teleconsultation; error?: string }>(res);
  await requireOk(res, data);
  if (!data.consultation) throw new Error("Missing consultation in response");
  return data.consultation;
}

/** PATCH /api/teleconsultations/:id — doctor (fields below) or patient (status cancelled only). */
export async function patchTeleconsultationApi(
  id: string,
  body: PatchTeleconsultationInput,
): Promise<Teleconsultation> {
  const res = await fetch(
    `${API_BASE}/api/teleconsultations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    },
  );
  const data = await parseJson<{ consultation?: Teleconsultation; error?: string }>(res);
  await requireOk(res, data);
  if (!data.consultation) throw new Error("Missing consultation in response");
  return data.consultation;
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

/** GET /api/clinical/doctor-patient-connections — scoped by role. */
export async function fetchDoctorPatientConnectionsApi(): Promise<
  DoctorPatientConnectionRow[]
> {
  const res = await fetch(`${API_BASE}/api/clinical/doctor-patient-connections`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<{
    connections?: DoctorPatientConnectionRow[];
    error?: string;
  }>(res);
  await requireOk(res, data);
  return data.connections ?? [];
}

/** POST — doctor initiates; active workspace required. */
export async function createDoctorPatientConnectionApi(patientId: string): Promise<
  DoctorPatientConnectionRow
> {
  const res = await fetch(`${API_BASE}/api/clinical/doctor-patient-connections`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ patient_id: patientId }),
  });
  const data = await parseJson<{
    connection?: DoctorPatientConnectionRow;
    error?: string;
  }>(res);
  await requireOk(res, data);
  if (!data.connection) throw new Error("Missing connection in response");
  return normalizeConnectionRow(data.connection);
}

/** POST — patient requests link to a doctor (pending). */
export async function requestDoctorConnectionAsPatientApi(
  doctorId: string,
): Promise<DoctorPatientConnectionRow> {
  const res = await fetch(`${API_BASE}/api/clinical/doctor-patient-connections`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ doctor_id: doctorId }),
  });
  const data = await parseJson<{
    connection?: DoctorPatientConnectionRow;
    error?: string;
  }>(res);
  await requireOk(res, data);
  if (!data.connection) throw new Error("Missing connection in response");
  return normalizeConnectionRow(data.connection);
}

function normalizeConnectionRow(
  raw: DoctorPatientConnectionRow,
): DoctorPatientConnectionRow {
  const base = raw as Record<string, unknown>;
  const withNested = base.doctor != null && base.patient != null
    ? (raw as DoctorPatientConnectionRow)
    : ({
        ...raw,
        doctor: {
          id: raw.doctor_id,
          full_name: "Unknown Doctor",
          email: null,
          license_number: null,
        },
        patient: {
          id: raw.patient_id,
          full_name: "Unknown Patient",
          email: null,
        },
      } as DoctorPatientConnectionRow);
  return withNested;
}

/** PATCH /api/clinical/doctor-patient-connections/:id — patient; status accepted | rejected. */
export async function respondToDoctorPatientConnectionApi(
  id: string,
  status: Extract<ConnectionStatus, "accepted" | "rejected">,
): Promise<DoctorPatientConnectionRow> {
  const res = await fetch(
    `${API_BASE}/api/clinical/doctor-patient-connections/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ status }),
    },
  );
  const data = await parseJson<{
    connection?: DoctorPatientConnectionRow;
    error?: string;
  }>(res);
  await requireOk(res, data);
  if (!data.connection) throw new Error("Missing connection in response");
  return data.connection;
}

/** Phase 5A — superadmin read-only legacy / attribution review (requires JWT role superadmin). */
export interface LegacyClinicalReviewRow {
  resource_type: "prescription" | "teleconsultation" | "doctor_patient_connection";
  id: string;
  created_at: string;
  updated_at: string;
  attribution_status: string;
  professional_tenant_id: string | null;
  created_by_membership_id: string | null;
  tenant_display_name: string | null;
  patient: { id: string; display_name: string | null };
  clinician: { id: string; display_name: string | null };
  summary: string | null;
  detail_status: string | null;
}

export interface LegacyClinicalReviewResponse {
  rows: LegacyClinicalReviewRow[];
  count: number;
  limit: number;
  offset: number;
  filters: {
    resource: string;
    attribution_status: string | string[];
  };
}

/** GET /api/admin/legacy-clinical — query: resource, attribution_status, limit, offset */
export async function fetchLegacyClinicalReviewApi(
  query?: Record<string, string | number | undefined>,
): Promise<LegacyClinicalReviewResponse> {
  const q = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") q.set(k, String(v));
    }
  }
  const qs = q.toString();
  const path = `${API_BASE}/api/admin/legacy-clinical${qs ? `?${qs}` : ""}`;
  const res = await fetch(path, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<LegacyClinicalReviewResponse & { error?: string; message?: string }>(
    res,
  );
  await requireOk(res, data);
  return data;
}
