import { buildAuthHeaders } from "@/lib/activeContext";
import type { UserProfile } from "@/types/user";
import type { BankHoliday, SupportedCountry } from "@/types/domain";
import type { Role } from "@/types/role";

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

export async function fetchAdminProfiles(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/api/admin/profiles`, {
    headers: await authHeaders(),
  });
  const data = await parseJson<{ profiles?: UserProfile[]; error?: string }>(
    res,
  );
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data.profiles ?? [];
}

export async function fetchAdminRoles(): Promise<Role[]> {
  const res = await fetch(`${API_BASE}/api/admin/roles`, {
    headers: await authHeaders(),
  });
  const data = await parseJson<{ roles?: Role[]; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data.roles ?? [];
}

export async function patchAdminProfileRole(
  userId: string,
  role: UserProfile["role"],
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/admin/profiles/${encodeURIComponent(userId)}/role`,
    {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ role }),
    },
  );
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
}

export async function postAdminProfileToggleBlock(
  userId: string,
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE}/api/admin/profiles/${encodeURIComponent(userId)}/toggle-block`,
    {
      method: "POST",
      headers: await authHeaders(),
    },
  );
  const data = await parseJson<{ error?: string; is_blocked?: boolean }>(res);
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return Boolean(data.is_blocked);
}

export async function postAdminProfileSoftDelete(userId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/admin/profiles/${encodeURIComponent(userId)}/soft-delete`,
    {
      method: "POST",
      headers: await authHeaders(),
    },
  );
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
}

export async function fetchAdminBankHolidays(
  country: SupportedCountry,
): Promise<BankHoliday[]> {
  const q = new URLSearchParams({ country });
  const res = await fetch(`${API_BASE}/api/admin/bank-holidays?${q}`, {
    headers: await authHeaders(),
  });
  const data = await parseJson<{ holidays?: BankHoliday[]; error?: string }>(
    res,
  );
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  return data.holidays ?? [];
}

export async function createAdminBankHoliday(input: {
  country: SupportedCountry;
  holiday_name: string;
  holiday_date: string;
}): Promise<BankHoliday> {
  const res = await fetch(`${API_BASE}/api/admin/bank-holidays`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ holiday?: BankHoliday; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
  if (!data.holiday) {
    throw new Error("Invalid response");
  }
  return data.holiday;
}

export async function deleteAdminBankHoliday(id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/admin/bank-holidays/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: await authHeaders(),
    },
  );
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
}
