import { buildAuthHeaders } from "@/lib/activeContext";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

export interface AdminDashboardStatsRow {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  total_products: number;
}

export async function fetchAdminDashboardStatsApi(): Promise<AdminDashboardStatsRow> {
  const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
    method: "GET",
    headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
  });
  const data = await res.json().catch(() => ({})) as AdminDashboardStatsRow & {
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || res.statusText);
  return {
    total_users: Number(data.total_users ?? 0),
    total_roles: Number(data.total_roles ?? 0),
    total_permissions: Number(data.total_permissions ?? 0),
    total_products: Number(data.total_products ?? 0),
  };
}
