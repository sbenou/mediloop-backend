const DASHBOARD_MODE_KEY = "mediloop.dashboard_mode_by_role";

type SwitchableRole = "doctor" | "pharmacist";
export type DashboardMode = "role" | "patient";

function isSwitchableRole(role?: string | null): role is SwitchableRole {
  const normalized = (role || "").toLowerCase();
  return normalized === "doctor" || normalized === "pharmacist";
}

function readStoredModes(): Partial<Record<SwitchableRole, DashboardMode>> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(DASHBOARD_MODE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<Record<SwitchableRole, DashboardMode>>;
  } catch {
    return {};
  }
}

function writeStoredModes(modes: Partial<Record<SwitchableRole, DashboardMode>>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DASHBOARD_MODE_KEY, JSON.stringify(modes));
}

export function getPreferredDashboardMode(role?: string | null): DashboardMode {
  if (!isSwitchableRole(role)) return "role";
  const stored = readStoredModes();
  return stored[role] === "patient" ? "patient" : "role";
}

export function setPreferredDashboardMode(
  role: string | null | undefined,
  mode: DashboardMode,
): void {
  if (!isSwitchableRole(role)) return;
  const stored = readStoredModes();
  stored[role] = mode;
  writeStoredModes(stored);
}

