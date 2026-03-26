import { V2_SESSION_STORAGE_KEYS } from "@/lib/auth/v2SessionStorage";
import type { UserWearable } from "@/types/wearables";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN) ||
    localStorage.getItem("auth_token")
  );
}

async function authHeaders(): Promise<HeadersInit> {
  const token = getAccessToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchMyWearables(): Promise<UserWearable[]> {
  const res = await fetch(`${API_BASE}/api/wearables`, {
    method: "GET",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  const data = (await res.json()) as { wearables?: UserWearable[] };
  return data.wearables ?? [];
}

export async function createWearable(body: {
  device_type: string;
  device_name: string;
  device_id: string;
  connection_status?: string;
  last_synced?: string | null;
  battery_level?: number | null;
  meta?: unknown;
}): Promise<UserWearable> {
  const res = await fetch(`${API_BASE}/api/wearables`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  const data = (await res.json()) as { wearable: UserWearable };
  return data.wearable;
}

export async function patchWearable(
  id: string,
  body: {
    last_synced?: string;
    battery_level?: number | null;
    connection_status?: string;
    meta?: unknown;
  },
): Promise<UserWearable> {
  const res = await fetch(`${API_BASE}/api/wearables/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  const data = (await res.json()) as { wearable: UserWearable };
  return data.wearable;
}

export async function deleteWearable(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/wearables/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (res.status === 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Not found");
  }
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
}
