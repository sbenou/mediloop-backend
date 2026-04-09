import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/user";
import { V2_SESSION_STORAGE_KEYS } from "@/lib/auth/v2SessionStorage";

const V2_USER_JSON_KEY = "mediloop_v2_user";

function profileShell(
  userId: string,
  role: string,
  full_name: string | null,
  email: string | null,
): UserProfile {
  const r = role.toLowerCase();
  return {
    id: userId,
    role: r,
    role_id: null,
    full_name,
    email,
    avatar_url: null,
    date_of_birth: null,
    city: null,
    auth_method: "password",
    is_blocked: false,
    doctor_stamp_url: null,
    doctor_signature_url: null,
    pharmacist_stamp_url: null,
    pharmacist_signature_url: null,
    cns_card_front: null,
    cns_card_back: null,
    cns_number: null,
    deleted_at: null,
    created_at: null,
    updated_at: null,
    license_number: null,
    phone_number: null,
    address: null,
    pharmacy_id: null,
    pharmacy_name: null,
    pharmacy_logo_url: null,
    email_verified: null,
  };
}

/**
 * When `/api/auth/profile` is unreachable but login persisted `mediloop_v2_user`,
 * build Recoil-shaped auth so the app does not block on Supabase or a stuck profile fetch.
 */
export function readBootstrapProfileFromV2Storage(userId: string): {
  user: User;
  profile: UserProfile;
  permissions: string[];
} | null {
  if (typeof window === "undefined") return null;
  const storedId = localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID);
  if (!storedId || storedId !== userId) return null;
  const raw = localStorage.getItem(V2_USER_JSON_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as {
      id?: string;
      email?: string;
      role?: string;
      full_name?: string;
    };
    if (u.id && u.id !== userId) return null;
    const role = (u.role || "patient").toLowerCase();
    const profile = profileShell(userId, role, u.full_name ?? null, u.email ?? null);
    const user = { id: userId, email: u.email } as User;
    return { user, profile, permissions: [] };
  } catch {
    return null;
  }
}

export function hasV2SessionStorage(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    localStorage.getItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN) &&
      localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID),
  );
}
