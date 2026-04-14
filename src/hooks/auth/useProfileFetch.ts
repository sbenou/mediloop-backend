import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/user';
import { fetchUserPermissions } from '@/lib/auth/sessionUtils';
import { buildAuthHeaders } from "@/lib/activeContext";
import { V2_SESSION_STORAGE_KEYS } from "@/lib/auth/v2SessionStorage";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';

/** Mediloop API expects the Deno JWT. Prefer stored V2 token over a Supabase session token. */
function resolveAccessToken(explicit?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  const v2 =
    localStorage.getItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN) ||
    localStorage.getItem('auth_token') ||
    null;
  if (v2) return v2;
  if (explicit) return explicit;
  return null;
}

const PROFILE_FETCH_DEADLINE_MS = 25_000;

async function fetchWithOptionalDeadline(
  url: string,
  init: RequestInit,
  outerSignal: AbortSignal | undefined,
): Promise<Response> {
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), PROFILE_FETCH_DEADLINE_MS);
  const cancelTimer = () => window.clearTimeout(tid);
  if (outerSignal) {
    if (outerSignal.aborted) ctrl.abort();
    else {
      outerSignal.addEventListener(
        'abort',
        () => {
          cancelTimer();
          ctrl.abort();
        },
        { once: true },
      );
    }
  }
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    cancelTimer();
  }
}

function profileFromApiPayload(
  p: Record<string, unknown>,
  userId: string,
): UserProfile {
  return {
    id: String(p.id ?? userId),
    role: (p.role as string) ?? 'patient',
    role_id: (p.role_id as string | null) ?? null,
    full_name: (p.full_name as string | null) ?? null,
    email: (p.email as string | null) ?? null,
    avatar_url: (p.avatar_url as string | null) ?? null,
    date_of_birth: (p.date_of_birth as string | null) ?? null,
    city: (p.city as string | null) ?? null,
    auth_method: (p.auth_method as string | null) ?? null,
    is_blocked: (p.is_blocked as boolean | null) ?? false,
    doctor_stamp_url: (p.doctor_stamp_url as string | null) ?? null,
    doctor_signature_url: (p.doctor_signature_url as string | null) ?? null,
    pharmacist_stamp_url: (p.pharmacist_stamp_url as string | null) ?? null,
    pharmacist_signature_url: (p.pharmacist_signature_url as string | null) ?? null,
    cns_card_front: (p.cns_card_front as string | null) ?? null,
    cns_card_back: (p.cns_card_back as string | null) ?? null,
    cns_number: (p.cns_number as string | null) ?? null,
    deleted_at: (p.deleted_at as string | null) ?? null,
    created_at: (p.created_at as string | null) ?? null,
    updated_at: (p.updated_at as string | null) ?? null,
    license_number: (p.license_number as string | null) ?? null,
    phone_number: (p.phone_number as string | null) ?? null,
    address: (p.address as string | null) ?? null,
    pharmacy_id: (p.pharmacy_id as string | null) ?? null,
    pharmacy_name: (p.pharmacy_name as string | null) ?? null,
    pharmacy_logo_url: (p.pharmacy_logo_url as string | null) ?? null,
    email_verified:
      typeof p.email_verified === 'boolean' ? p.email_verified : null,
    has_dashboard:
      typeof p.has_dashboard === 'boolean' ? p.has_dashboard : null,
    dashboard_route: (p.dashboard_route as string | null) ?? null,
  };
}

/** Result for V2 JWT bootstrap (no Supabase session). */
export type V2JwtProfileResult =
  | { status: "ok"; profile: UserProfile; permissions: string[] }
  | { status: "unauthorized" }
  | { status: "failed" };

/**
 * Load profile using only the backend JWT — used on cold start after V2 login.
 * Does not fall back to Supabase (V2-only accounts have no Supabase row).
 */
export async function fetchProfileForV2Jwt(
  userId: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<V2JwtProfileResult> {
  try {
    const res = await fetchWithOptionalDeadline(
      `${API_BASE}/api/auth/profile`,
      {
        method: "GET",
        headers: buildAuthHeaders({
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }),
      },
      signal,
    );
    if (res.status === 401 || res.status === 403) {
      return { status: "unauthorized" };
    }
    if (!res.ok) {
      return { status: "failed" };
    }
    const data = (await res.json()) as {
      profile?: Record<string, unknown>;
      permissions?: string[];
    };
    if (!data.profile) {
      return { status: "failed" };
    }
    return {
      status: "ok",
      profile: profileFromApiPayload(data.profile, userId),
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
  } catch {
    return { status: "failed" };
  }
}

function minimalProfile(userId: string): UserProfile {
  return {
    id: userId,
    role: 'patient',
    role_id: null,
    full_name: 'User',
    email: null,
    avatar_url: null,
    date_of_birth: null,
    city: null,
    auth_method: 'password',
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
    has_dashboard: null,
    dashboard_route: null,
  };
}

export const useProfileFetch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const fetchInProgress = useRef<Map<string, Promise<{ profile: UserProfile | null; permissions: string[] }>>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const fetchAndSetProfile = useCallback(async (userId: string, accessToken?: string | null): Promise<{ profile: UserProfile | null; permissions: string[] }> => {
    if (!userId) {
      console.error('No user ID provided to fetchAndSetProfile');
      return { profile: null, permissions: [] };
    }

    const existingFetch = fetchInProgress.current.get(userId);
    if (existingFetch) {
      console.log('Profile fetch already in progress for user:', userId);
      return existingFetch;
    }

    const existingController = abortControllers.current.get(userId);
    if (existingController) {
      existingController.abort();
      abortControllers.current.delete(userId);
    }

    const abortController = new AbortController();
    abortControllers.current.set(userId, abortController);

    console.log('Starting profile fetch for user:', userId);

    const fetchPromise = (async () => {
      const deadlineId = window.setTimeout(
        () => abortController.abort(),
        PROFILE_FETCH_DEADLINE_MS,
      );
      const clearDeadline = () => window.clearTimeout(deadlineId);
      try {
        setIsLoading(true);

        if (abortController.signal.aborted) {
          throw new Error('Fetch aborted');
        }

        const token = resolveAccessToken(accessToken ?? null);

        if (token) {
          try {
            const res = await fetchWithOptionalDeadline(
              `${API_BASE}/api/auth/profile`,
              {
                method: 'GET',
                headers: buildAuthHeaders({
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }),
              },
              abortController.signal,
            );

            if (res.ok) {
              const data = (await res.json()) as {
                profile?: Record<string, unknown>;
                permissions?: string[];
              };
              if (data.profile) {
                const completeProfile = profileFromApiPayload(data.profile, userId);
                const permissions = Array.isArray(data.permissions)
                  ? data.permissions
                  : [];
                console.log('Profile and permissions loaded from API:', {
                  profileId: completeProfile.id,
                  role: completeProfile.role,
                  permissionsCount: permissions.length,
                });
                return { profile: completeProfile, permissions };
              }
            } else {
              console.warn(
                'API profile fetch failed, falling back to Supabase:',
                res.status,
              );
            }
          } catch (apiErr) {
            if (abortController.signal.aborted) {
              throw new Error('Fetch aborted');
            }
            console.warn('API profile error, falling back to Supabase:', apiErr);
          }
        }

        const v2StoredId = localStorage.getItem(V2_SESSION_STORAGE_KEYS.USER_ID);
        const v2Token =
          localStorage.getItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN) ||
          localStorage.getItem('auth_token');
        if (v2StoredId === userId && v2Token) {
          const v2 = await fetchProfileForV2Jwt(userId, v2Token, abortController.signal);
          if (v2.status === 'ok') {
            return { profile: v2.profile, permissions: v2.permissions };
          }
          console.warn(
            '[fetchAndSetProfile] V2 JWT session active but profile not loaded; skipping legacy Supabase (often absent on Neon)',
          );
          return { profile: null, permissions: [] };
        }

        console.log('Fetching profile from Supabase (legacy)...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            id, role, role_id, full_name, email, avatar_url, auth_method,
            is_blocked, city, date_of_birth, license_number, cns_card_front,
            cns_card_back, cns_number, doctor_stamp_url, doctor_signature_url,
            pharmacist_stamp_url, pharmacist_signature_url, deleted_at,
            created_at, updated_at, pharmacy_name, pharmacy_logo_url
          `)
          .eq('id', userId)
          .abortSignal(abortController.signal)
          .maybeSingle();

        if (abortController.signal.aborted) {
          throw new Error('Fetch aborted');
        }

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }

        if (!profile) {
          console.log('No profile found for user:', userId);
          return { profile: minimalProfile(userId), permissions: [] };
        }

        let pharmacyId = null;
        try {
          if (!abortController.signal.aborted) {
            const { data: pharmacyData } = await supabase
              .from('user_pharmacies')
              .select('pharmacy_id')
              .eq('user_id', userId)
              .abortSignal(abortController.signal)
              .maybeSingle();

            pharmacyId = pharmacyData?.pharmacy_id || null;
          }
        } catch (pharmacyError) {
          console.warn('Error fetching pharmacy_id:', pharmacyError);
        }

        const completeProfile: UserProfile = {
          ...(profile as unknown as UserProfile),
          pharmacist_stamp_url: profile?.pharmacist_stamp_url || null,
          pharmacist_signature_url: profile?.pharmacist_signature_url || null,
          pharmacy_id: pharmacyId || null,
          pharmacy_name: profile?.pharmacy_name || null,
          pharmacy_logo_url: profile?.pharmacy_logo_url || null,
        };

        let userPermissions: string[] = [];
        try {
          if (completeProfile.role_id && !abortController.signal.aborted) {
            userPermissions = await fetchUserPermissions(completeProfile.role_id);
          }
        } catch (permError) {
          console.warn('Error fetching permissions:', permError);
        }

        console.log('Profile and permissions fetched successfully (Supabase):', {
          profileId: completeProfile.id,
          role: completeProfile.role,
          permissionsCount: userPermissions.length,
        });

        return { profile: completeProfile, permissions: userPermissions };
      } catch (error) {
        if (abortController.signal.aborted) {
          console.log('Profile fetch was aborted for user:', userId);
          throw new Error('Fetch aborted');
        }

        console.error('Error in fetchAndSetProfile:', error);

        return { profile: minimalProfile(userId), permissions: [] };
      } finally {
        clearDeadline();
        setIsLoading(false);
        fetchInProgress.current.delete(userId);
        abortControllers.current.delete(userId);
      }
    })();

    fetchInProgress.current.set(userId, fetchPromise);

    return fetchPromise;
  }, []);

  const cleanup = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    fetchInProgress.current.clear();
  }, []);

  return {
    fetchAndSetProfile,
    isLoading,
    cleanup,
  };
};

export default useProfileFetch;
