/** Use this for every Mediloop Deno API URL (matches other clients). */
export const MEDILOOP_API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const API_BASE = MEDILOOP_API_BASE;

const ACTIVE_CONTEXT_KEY = "mediloop_active_context_v1";

export interface WorkspaceMembershipContext {
  membership_id: string;
  tenant_id: string;
  role: string;
  status: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string | null;
  tenant: {
    id: string;
    name: string;
    tenant_type?: string | null;
    schema?: string | null;
    domain?: string | null;
    is_personal_health_owner?: boolean;
  };
}

export interface ActiveContextSelection {
  membershipId: string;
  tenantId: string;
}

export interface MyContextsResponse {
  user_id: string;
  memberships: WorkspaceMembershipContext[];
  current_context?: {
    tenantId: string;
    membershipId: string;
    tenantRole: string;
    source: "request_headers" | "legacy_jwt_membership";
  } | null;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("mediloop_access_token") ||
    localStorage.getItem("auth_token") ||
    null
  );
}

export function getStoredActiveContext(): ActiveContextSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveContextSelection>;
    if (!parsed.membershipId || !parsed.tenantId) return null;
    return {
      membershipId: parsed.membershipId,
      tenantId: parsed.tenantId,
    };
  } catch {
    return null;
  }
}

export function setStoredActiveContext(value: ActiveContextSelection): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_CONTEXT_KEY, JSON.stringify(value));
}

export function clearStoredActiveContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_CONTEXT_KEY);
}

export function resolveDefaultContext(
  memberships: WorkspaceMembershipContext[],
  currentContext?: MyContextsResponse["current_context"] | null,
): ActiveContextSelection | null {
  const activeMemberships = memberships.filter(
    (m) => m.is_active && m.status === "active",
  );
  if (!activeMemberships.length) return null;

  if (currentContext?.membershipId && currentContext?.tenantId) {
    const exists = activeMemberships.some(
      (m) =>
        m.membership_id === currentContext.membershipId &&
        m.tenant_id === currentContext.tenantId,
    );
    if (exists) {
      return {
        membershipId: currentContext.membershipId,
        tenantId: currentContext.tenantId,
      };
    }
  }

  const primary = activeMemberships.find((m) => m.is_default);
  if (primary) {
    return {
      membershipId: primary.membership_id,
      tenantId: primary.tenant_id,
    };
  }

  return {
    membershipId: activeMemberships[0].membership_id,
    tenantId: activeMemberships[0].tenant_id,
  };
}

export function buildAuthHeaders(
  baseHeaders?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    ...(baseHeaders || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const active = getStoredActiveContext();
  if (active?.tenantId && active?.membershipId) {
    headers["X-Mediloop-Tenant-Id"] = active.tenantId;
    headers["X-Mediloop-Membership-Id"] = active.membershipId;
  }

  return headers;
}

export async function fetchMyContexts(): Promise<MyContextsResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  const res = await fetch(`${API_BASE}/api/auth/me/contexts`, {
    method: "GET",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  return (await res.json()) as MyContextsResponse;
}
