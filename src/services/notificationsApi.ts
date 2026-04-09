import { buildAuthHeaders, MEDILOOP_API_BASE } from "@/lib/activeContext";

export interface ApiNotificationRow {
  id: string;
  title: string;
  body: string;
  data?: unknown;
  image_url?: string | null;
  sent_at?: string;
  read_at?: string | null;
  clicked_at?: string | null;
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}

export type NotificationInboxScope =
  | "tenant"
  | "personal_health"
  | "professional_personal";

/**
 * Neon-backed notification history — scoped by JWT + active workspace headers Option C;
 * optional `inbox` forces surface; omit for auto (personal-health tenant vs workplace).
 */
export async function fetchNotificationHistoryApi(
  _userId: string,
  limit = 50,
  inbox?: NotificationInboxScope,
): Promise<ApiNotificationRow[]> {
  const url = new URL(`${MEDILOOP_API_BASE}/api/notifications/history`);
  url.searchParams.set("limit", String(limit));
  if (inbox) url.searchParams.set("inbox", inbox);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(),
  });
  const data = await parseJson<{
    notifications?: ApiNotificationRow[];
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data.notifications ?? [];
}

export async function markNotificationReadApi(
  notificationId: string,
  inbox?: NotificationInboxScope,
): Promise<void> {
  const body: { notificationId: string; inbox?: string } = { notificationId };
  if (inbox) body.inbox = inbox;
  const res = await fetch(`${MEDILOOP_API_BASE}/api/notifications/mark-read`, {
    method: "POST",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || res.statusText);
}
