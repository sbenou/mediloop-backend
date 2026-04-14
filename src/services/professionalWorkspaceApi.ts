import { buildAuthHeaders } from "@/lib/activeContext";

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

export interface PharmacyWorkspaceRow {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  email?: string | null;
  endorsed?: boolean;
  created_at?: string;
  logo_url?: string | null;
}

export async function fetchPharmacyWorkspaceApi(): Promise<PharmacyWorkspaceRow> {
  const res = await fetch(`${API_BASE}/api/pharmacy/workspace`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<{ pharmacy?: PharmacyWorkspaceRow; error?: string }>(
    res,
  );
  if (!res.ok) throw new Error(data.error || res.statusText);
  if (!data.pharmacy?.id) throw new Error("Missing pharmacy in response");
  return data.pharmacy;
}

export async function updatePharmacyWorkspaceApi(
  body: Partial<{
    name: string;
    address: string;
    city: string;
    postal_code: string;
    phone: string | null;
    email: string | null;
    hours: string | null;
    logo_url: string | null;
  }>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/pharmacy/workspace`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
}

export interface PharmacyTeamMemberRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
}

export async function fetchPharmacyTeamApi(): Promise<PharmacyTeamMemberRow[]> {
  const res = await fetch(`${API_BASE}/api/pharmacy/workspace/team`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<{ members?: PharmacyTeamMemberRow[]; error?: string }>(
    res,
  );
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data.members ?? [];
}

export async function patchPharmacyTeamMemberBlockedApi(
  memberId: string,
  blocked: boolean,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/pharmacy/workspace/team/${encodeURIComponent(memberId)}`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ blocked }),
    },
  );
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
}

export interface DoctorWorkspaceResponse {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  metadata: {
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    logo_url?: string | null;
    hours?: string | null;
  };
}

export async function fetchDoctorWorkspaceApi(): Promise<DoctorWorkspaceResponse> {
  const res = await fetch(`${API_BASE}/api/doctor/workspace`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJson<DoctorWorkspaceResponse & { error?: string }>(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function updateDoctorWorkspaceApi(
  body: Partial<{
    full_name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    logo_url: string | null;
    hours: string | null;
  }>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/doctor/workspace`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
}
