/**
 * Clinical domain types aligned with the Mediloop **Deno API + Neon Postgres** stack.
 * Use this module for prescriptions, teleconsultations, and doctor–patient connections
 * served by `backend/` (`/api/prescriptions`, `/api/teleconsultations`, etc.).
 */

/** Matches `public.connection_status` / clinical API. */
export type ConnectionStatus = "pending" | "accepted" | "rejected";

/** Matches `teleconsultation_status` enum from Neon. */
export type TeleconsultationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

/** Teleconsultation row as returned by GET/POST/PATCH clinical routes (with nested joins when listed). */
export interface Teleconsultation {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  status: TeleconsultationStatus;
  room_id?: string;
  created_at: string;
  updated_at: string;
  meta?: Record<string, unknown>;
  professional_tenant_id?: string | null;
  created_by_membership_id?: string | null;
  /** Resolved clinic/workspace label for patient-safe responses. */
  issued_by_workspace_name?: string | null;
  doctor?: {
    id?: string;
    full_name: string;
    email: string | null;
  };
  patient?: {
    id?: string;
    full_name: string;
    email: string | null;
  };
}
