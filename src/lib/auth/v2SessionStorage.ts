/**
 * Canonical localStorage keys for Deno JWT session (must match AuthContext V2).
 * Login/OAuth clients should call persistV2SessionFromBackendLogin so refresh
 * and useProfileFetch see the same tokens.
 */
export const V2_SESSION_STORAGE_KEYS = {
  ACCESS_TOKEN: "mediloop_access_token",
  REFRESH_TOKEN: "mediloop_refresh_token",
  USER_ID: "mediloop_user_id",
} as const;

export function persistV2SessionFromBackendLogin(params: {
  accessToken: string;
  refreshToken?: string | null;
  userId: string;
}): void {
  const rt = params.refreshToken || params.accessToken;
  localStorage.setItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN, params.accessToken);
  localStorage.setItem(V2_SESSION_STORAGE_KEYS.REFRESH_TOKEN, rt);
  localStorage.setItem(V2_SESSION_STORAGE_KEYS.USER_ID, params.userId);
}

/** After server-side token rotation (same user). */
export function updateV2AccessToken(newAccessToken: string): void {
  localStorage.setItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
  if (!localStorage.getItem(V2_SESSION_STORAGE_KEYS.REFRESH_TOKEN)) {
    localStorage.setItem(
      V2_SESSION_STORAGE_KEYS.REFRESH_TOKEN,
      newAccessToken,
    );
  }
}

export function clearV2SessionStorageKeys(): void {
  localStorage.removeItem(V2_SESSION_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(V2_SESSION_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(V2_SESSION_STORAGE_KEYS.USER_ID);
}
