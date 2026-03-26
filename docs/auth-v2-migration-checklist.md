# Auth V2 migration — architecture, checklist, and next steps

This document captures how authentication works in the **Deno backend** today, how it relates to **shared** infrastructure (Postgres, tenants, KV), what remains on **Supabase / edge functions** in the frontend, and the **order of work** recommended before migrating edge functions one by one.

---

## 1. Recommended order of work

1. **Complete Auth V2 on the frontend** — one session model, profile + permissions loaded from the Deno API / Neon (not `supabase.from('profiles')` for production paths).
2. **Align OAuth and national IDP routes** with what the frontend actually calls (mount routers, path prefixes).
3. **Automate remaining backend tests** that still depend on log scraping (password reset flows use **Deno KV**; see §7).
4. **Migrate Supabase edge functions** to Deno routes or workers, using a single `Authorization: Bearer` contract.

---

## 2. Backend auth module — layout

Primary location: `backend/modules/auth/`.

| Area | Path | Role |
|------|------|------|
| HTTP routes (Oak) | `routes/auth.ts` | Register, email verification, login, logout, verify-token, refresh, profile |
| | `routes/passwordReset.ts` | OTP / link reset (KV-backed tokens) |
| | `routes/tokenManagement.ts` | Alternate refresh/revoke-style endpoints |
| | `routes/tokenRotation.ts` | Client poll for rotated token; admin trigger |
| | `routes/domainVerification.ts` | Tenant custom domain initiate / verify / remove |
| | `routes/invitation.ts` | Invitation validate / accept |
| | `routes/oauth.ts` | Google, **FranceConnect**, LuxTrust redirect flows (see §5 — **not mounted in `main.ts` today**) |
| Hono (isolated) | `routes/luxtrust.ts` | Mock/sandbox LuxTrust auth, ID verify, diploma upload/verify, geo (see §5) |
| Middleware | `middleware/authMiddleware.ts` | JWT verification; public path allowlist |
| | `middleware/roleMiddleware.ts` | DB-driven RBAC (roles, categories, assignments) |
| Services | `services/enhancedJwtService.ts` | Issue JWT, verify against session + blacklist, refresh, revoke |
| | `services/sessionService.ts` | `auth.jwt_sessions` (partitioned by `tenant_id`), audit logging |
| | `services/tokenRotationService.ts` | **Deno KV** — schedule rotation, store rotated tokens for pickup |
| | `services/registrationService.ts` | User + tenant onboarding |
| | `services/passwordService.ts` | bcrypt |
| | `services/emailVerificationService.ts` | Verification tokens |
| | `services/domainVerificationService.ts` | Domain verification workflow |
| | `services/jwtService.ts` | Older HS256 helper (superseded for app paths by enhanced service) |

---

## 3. End-to-end authentication flow (backend)

### 3.1 Registration and email verification

1. **`POST /api/auth/register`** (`auth.ts`) → `registrationService.registerUser` (validation via `shared/utils/validation.ts`).
2. Response is **201** with **no tokens**; user must verify email.
3. **`GET|POST /api/auth/verify-email`**, resend / status endpoints → `databaseService` + `EmailVerificationService`.
4. After verification, the handler can mint tokens via **`enhancedJwtService.createToken`** (same as login).

### 3.2 Login

1. **`POST /api/auth/login`** → `databaseService.verifyUserPassword` (reads `auth.users`, bcrypt via `passwordService`).
2. **`enhancedJwtService.createToken`**:
   - Resolves **`tenant_id`** for the user (required — token creation fails if missing).
   - Builds JWT (JOSE HS256): `sub`, `email`, `role`, **`tenant_id`**, `session_id`, `jti`, iss/aud, expiry (~24h).
   - Hashes token, **`sessionService.createSession`** → row in **`auth.jwt_sessions`** with `tenant_id` (partition key).
   - Optionally **`tokenRotationService.scheduleTokenRotation`** (KV).

### 3.3 Authenticated requests

1. **`tokenBlacklistMiddleware`** (`shared/middleware/tokenBlacklistMiddleware.ts`) runs early.
2. **`authMiddleware`** (`auth.ts` stack in `main.ts`):
   - **Public routes** use a string **substring** allowlist (`PUBLIC_ROUTES`). Any path **containing** a listed fragment is skipped (e.g. paths containing `/login`, `/register`).
   - Otherwise requires `Authorization: Bearer <jwt>`.
3. **`enhancedJwtService.verifyToken`**:
   - JOSE verify iss/aud.
   - Hash token → **not blacklisted** → **active session** in `auth.jwt_sessions` → updates last activity.
4. **`ctx.state.user`**: `id`, `email`, `role`, `tenant_id`, `session_id`.

### 3.4 Refresh and logout

- **`POST /api/auth/refresh`** (and `tokenManagement` variants): **`enhancedJwtService.refreshToken`** — verifies old token, blacklists old hash, deactivates old session, **`createToken`** for new session.
- **`POST /api/auth/logout`**: revokes session / blacklists token (via enhanced JWT + session service).

### 3.5 Token rotation (background)

- **`main.ts`** registers **`Deno.cron`** every 5 minutes → **`tokenRotationService.processScheduledRotations`**.
- Rotation metadata and short-lived “rotated token” payloads live in **Deno KV**.
- Clients can **`GET /rotated-token`** (`tokenRotation.ts`) with a valid Bearer token to pick up a freshly rotated token.

### 3.6 Password reset

- Implemented in **`routes/passwordReset.ts`**; OTP and opaque reset tokens are stored in **KV** (`kvStore` / Deno KV), not Postgres — automated tests cannot read them via `tests/utils/testDb.ts` alone.

---

## 4. Shared layer — how auth sits on infrastructure

Location: `backend/shared/`.

| Component | Path | Role |
|-----------|------|------|
| **Config** | `config/env.ts`, `config/appConfig.ts`, `config/envLoader.ts` | Vault + env merge; DB URL selection (`TEST_DATABASE_URL` overrides in test); **FranceConnect** env keys |
| **Postgres** | `services/postgresService.ts` | Facade: **`PostgresClient`**, **`TenantManager`**, **`SchemaManager`**, **`QueryHelper`** |
| | `services/postgres/PostgresClient.ts` | Connection lifecycle, queries |
| | `services/postgres/TenantManager.ts` | `public.tenants`, per-tenant schema name `tenant_{role}_{userId}`, `SchemaManager.createTenantSchema` |
| | `services/postgres/SchemaManager.ts` | Tenant DDL; includes `verification_method` enum allowing **`luxtrust` / `franceconnect`** |
| **Data access** | `services/databaseService.ts` | Login user fetch, profiles, verification, etc. (uses `PostgresService` pool client) |
| **KV** | `services/kvStore.ts` | LuxTrust verification blobs, shared KV helpers |
| **Email / rate limits** | `services/emailService.ts`, `middleware/rateLimitMiddleware.ts`, `dynamicRateLimitMiddleware.ts` | Registration/login/refresh throttling |
| **Types** | `types/auth.ts`, `types/tenant.ts` | Shared models |

**Multi-tenancy (today):**

- JWT carries **`tenant_id`**.
- Sessions live in **`auth.jwt_sessions`** partitioned on **`tenant_id`**.
- **`TenantManager`** creates **`public.tenants`** rows and physical **schemas** per tenant for isolated data.

**Future extraction (your direction):** moving **database service**, **tenant/schema provisioning**, and **domain verification** out of the auth module into dedicated services would mean:

- Keeping **JWT issuance / session / blacklist** in auth.
- Calling a **tenant service** for resolution and schema operations.
- Calling a **domain service** for `/api/domain/*` routes.

That split is not implemented yet; this doc reflects the **current** coupling.

---

## 5. LuxTrust and FranceConnect

### 5.1 FranceConnect (backend)

- **Implemented** in `backend/modules/auth/routes/oauth.ts` (integration endpoints against `fcp.integ01.dev-franceconnect.fr`).
- **Env:** `FRANCECONNECT_CLIENT_ID`, `FRANCECONNECT_CLIENT_SECRET` (also surfaced in Vault setup scripts and `DenoBackendManagement.tsx`).

### 5.2 LuxTrust

- **Redirect-style OAuth stub:** `oauth.ts` → `GET /oauth/luxtrust` (relative to wherever the router is mounted).
- **Richer mock/API surface (Hono):** `routes/luxtrust.ts` — `/auth`, `/verify-id`, `/certification/upload`, `/certification/verify`, `/location/detect`; uses **KV** for verification payloads.

### 5.3 Backend wiring (updated)

- **`oauthRoutes`** are mounted in `backend/main.ts` and `backend/test-server.ts` **before** `authMiddleware`, under **`/api/oauth/*`**. Redirect URIs use **`${SERVICE_URL}/api/oauth/.../callback`** — register the same URLs in Google / FranceConnect consoles.
- **LuxTrust sandbox** routes live in `backend/modules/auth/routes/luxtrust.ts` (Oak) at **`/api/luxtrust/*`**. `src/hooks/useLuxTrustAuth.ts` calls **`POST /api/luxtrust/auth`** on the Deno API (replaces the previous edge-function invoke for that flow).
- **Legacy duplicate:** `supabase/functions/auth-service/index.ts` still contains FranceConnect logic — keep only as a **migration reference** until removed.

---

## 6. Frontend — Auth V2 “definition of done”

Complete **before** prioritizing edge-function migration.

**Progress:** `src/lib/auth/v2SessionStorage.ts` is the single source for **`mediloop_access_token` / `mediloop_refresh_token` / `mediloop_user_id`**. `authClient`, `authClientV2`, `AuthCallback` (OAuth), and `tokenRotationClient` now persist or update these keys so **`AuthContext` V2** and **`useProfileFetch`** stay aligned. **`authClient.verifyToken`** calls **`POST /api/auth/verify-token`** (was a wrong path). API base URL uses **`VITE_API_URL` / `VITE_API_BASE_URL`** where updated.

| # | Checkpoint | Notes |
|---|------------|--------|
| 1 | **Single session bootstrap** | `AuthContext` should not depend on `supabase.auth.getSession()` for production users when V2 is enabled; V2 storage keys (`mediloop_access_token`, etc.) + refresh pipeline. |
| 2 | **Profile + permissions from backend** | `useProfileFetch` still uses `supabase.from('profiles')`; replace with **Deno API** + Neon-backed reads so RBAC matches the JWT tenant. |
| 3 | **Feature flags** | `src/lib/featureFlags.ts` — `VITE_ENABLE_SESSION_REFRESH_V2`, `VITE_ENABLE_MULTI_TAB_SYNC_V2`, password reset V2, etc. |
| 4 | **Guards** | `RequireRoleGuard` / `RequirePermissionGuard` consume **one** Recoil `authState` fed from (2). |
| 5 | **OAuth / LuxTrust / FranceConnect** | After backend routes are mounted, re-test full redirect + callback + token handoff. |

Key files (non-exhaustive): `src/contexts/AuthContext.tsx`, `src/lib/authClientV2.ts`, `src/hooks/auth/useSessionManagement.ts`, `src/hooks/auth/useProfileFetch.ts`, `src/lib/auth/sessionUtils.ts`, `src/providers/AuthProvider.tsx`.

---

## 7. Supabase edge functions still invoked from the frontend

Replace these **after** §6 with Deno routes (or workers), same auth header everywhere.

| Edge function | Frontend call sites |
|---------------|---------------------|
| `seed-notifications` | `src/utils/seedNotifications.ts`, `src/utils/mockDataSeeder.ts` |
| `create-pharmacy-subscription` | `src/pages/BecomePartner.tsx` |
| `process-connection-notifications` | `src/utils/doctorConnectionNotifications.ts`, `src/utils/connectionNotificationTests.ts` |
| `get-mapbox-token` | `src/services/address-service.ts` |
| `create-delivery-payment` | `src/components/cart/CartFooter.tsx` |
| `luxtrust-service` | `src/hooks/useLuxTrustIdVerification.ts`, `src/hooks/useLuxTrustAuth.ts` |
| `convert-points` | `src/components/loyalty/wallet/PointConversion.tsx` |

Also migrate or delete **`supabase/functions/**`** once each capability exists on the Deno backend.

---

## 8. Backend tests — automation follow-ups

- **`tests/backend/authPublicRoutes.test.ts`** — Embedded server on **port 8002** checks **`/api/oauth/*`** redirects, **`/api/luxtrust/*`** JSON responses (LuxTrust artificial delays are skipped when **`DENO_ENV=test`** in `test-server.ts`).
- **`GET /api/auth/profile`** — Returns **`permissions`**; **`emailVerification.test.ts`** asserts `permissions` is an array when the full flow or **`TEST_ACCESS_TOKEN`** is used (stale tokens yield 404 — refresh the env token if that optional test fails).
- **Password reset OTP / link tokens** live in **KV**, not Postgres → `tests/utils/testDb.ts` cannot see them.
- **Recommended:** test-only endpoint (gated by env) or test double KV to read `password_reset_*` keys, then assert full flows in `passwordReset.test.ts` without log scraping.

---

## 9. Quick reference — `main.ts` route stack (excerpt)

Order matters: password reset routes are registered **before** global `authMiddleware`; then auth, tokens, rotation, domain, email templates, login emails, invitations, payments, notifications, WebSocket.

See `backend/main.ts` for the authoritative list.

---

## 10. Next steps

1. **OAuth consoles:** Add authorized redirect URIs for `${SERVICE_URL}/api/oauth/google/callback` and `/api/oauth/franceconnect/callback`.
2. **`useLuxTrustIdVerification` / other LuxTrust calls** still using `supabase.functions.invoke('luxtrust-service')` — point them at `/api/luxtrust/*` when ready.
3. **KV test helper** for password reset automated tests (see §8).
4. Optionally remove **Supabase fallback** in `useProfileFetch` once Neon + API profile is stable everywhere.

---

*Last updated from a pass over `backend/modules/auth`, `backend/shared`, `backend/main.ts`, and frontend `src` OAuth/edge invoke sites. Update this file as routes are mounted or services are extracted.*
