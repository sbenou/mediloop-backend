# Architecture decisions: Option C (tenant context & clinical attribution)

**Status:** Accepted recommendation (implementation phases below)  
**Scope:** Multi-tenant memberships, active request context, audit, and professional clinical row attribution for Mediloop.

## Goal

Adopt Option C:

- one global identity  
- one personal-health tenant per user  
- many professional tenant memberships  
- one explicit acting context per request  
- strict auditability  
- no silent cross-context data access  

This document answers the repo-specific questions behind “your decisions for §1–2”.

This document is the canonical handoff for implementers and tests (e.g. TC-010; active context TC-020, TC-021, TC-030, TC-031; audit TC-060–TC-062; clinical TC-050, TC-051, TC-070, TC-071; patient read TC-040, TC-054).

---

## §1 — Memberships, personal tenant, active context, audit

### 1. Membership lifecycle

**Decision:** Use both `public.user_tenants` and a separate invitations table.

| Concern | Table | Role |
|--------|--------|------|
 Accepted memberships | `public.user_tenants` | Source of truth for users who can act in a tenant now |
 Pending / invite flow | `public.tenant_invitations` | Invites before account exists; expiry; acceptance tracking |

**Rationale:** Avoid mixing “can act now” with “email was invited and may join later”; no half-membership states in the membership table.

**`public.user_tenants` (accepted memberships only)**  
Suggested fields: `id`, `user_id`, `tenant_id`, `role`, `status`, `is_default`, `created_at`, `updated_at`, `accepted_at`, `revoked_at`, optional `invited_by_user_id`.  

**Note:** Today’s schema may still use `is_primary` for the default workspace; Option C names this `is_default`. Prefer consolidating to one column over time; until then, treat them as the same concept in product logic.

**Membership statuses (on real memberships only):** `active`, `suspended`, `revoked`, `left`.  
Do **not** use `pending` on `user_tenants` unless unavoidable; pending belongs on invitations.

**`public.tenant_invitations`**  
Suggested fields: `id`, `tenant_id`, `email`, `role`, `status` (`pending`, `accepted`, `expired`, `revoked`), `token_hash`, `invited_by_user_id`, `expires_at`, `accepted_by_user_id`, `accepted_at`, `created_at`, `updated_at`.

**Matrix mapping:** membership = `public.user_tenants`; pending invite = `public.tenant_invitations.status = pending` (TC-010).

---

### 2. Personal-health tenant

**Decision:** `public.tenants.tenant_type` includes `personal_health`, plus a one-to-one helper table.

- **`public.tenants`:** add `tenant_type` with values such as `personal_health`, `clinic`, `doctor_cabinet`, `hospital`, `pharmacy` (later e.g. `lab`).
- **`public.personal_health_tenants`:** `user_id`, `tenant_id` with **unique** `user_id` and **unique** `tenant_id`.

**Invariant:** Each user has exactly one personal-health tenant; row is identifiable via `tenant_type = 'personal_health'` and `personal_health_tenants`.

**Rationale:** `tenant_type` classifies the tenant; the helper table guarantees which user owns which personal tenant (lookup, repair scripts, TC-001–003).

---

### 3. Active context (JWT, session, headers)

**Decision:** Identity in JWT; default/last context on server session; **authoritative acting context on every protected request via headers**.

**JWT (identity-oriented):** e.g. `sub`, `session_id`, auth claims; optionally auth method / MFA — **not** the sole active tenant.

**Server-side session:** `session_id`, `user_id`, optional `last_active_membership_id` / `last_active_tenant_id` for default after login, restore, revocation — **not** the only authorization source.

**Per-request headers (protected APIs):**

- `X-Mediloop-Tenant-Id`
- `X-Mediloop-Membership-Id`

(Starting with only `X-Mediloop-Membership-Id` is acceptable if it uniquely implies tenant + role; both headers are preferred initially for debugging, logging, and mismatch rejection.)

**Resolution rule (each protected request):**

1. Authenticate JWT.  
2. Load session.  
3. Resolve membership from headers.  
4. Verify membership belongs to authenticated user and is active.  
5. Verify `membership.tenant_id` matches header tenant id.  
6. Authorize the action for that membership.  
7. Audit with resolved context.

**UX:** Workspace switch updates stored active workspace; subsequent requests send new headers; cancel in-flight queries for old context where needed.

**Matrix:** Explicit per-request context supports login/switch flows and multi-tab (TC-020, TC-021, TC-030, TC-031).

---

### 4. Audit

**Decision:** Dedicated `public.audit_events` (structured, queryable). Do not rely only on application logs.

**Suggested minimum columns:** `id`, `occurred_at`, `user_id`, `session_id`, `tenant_id`, `membership_id`, `role`, `action`, `resource_type`, `resource_id`, `target_patient_id` or `target_patient_tenant_id` where relevant, `outcome` (`success`, `denied`, `error`), `ip_address`, `user_agent`, `request_id`, `metadata` (jsonb).

**Write split:**

- **Middleware:** login, logout, context switch, denied access, invalid membership, token/session issues.  
- **Routes/services:** domain events (prescription created, consultation opened, patient record viewed, etc.).

---

## §2 — Professional clinical attribution

### 5. Strategy: columns on public clinical tables (Option A)

**Decision:** Add professional workspace and actor attribution on professional-origin rows in **`public`**, starting with tables such as `public.prescriptions`, `public.teleconsultations`, and similar artifacts.

**Columns:**

- `professional_tenant_id` — tenant under which the professional acted when creating the record (preferred name; ties to tenant model).
- `created_by_membership_id` — acting membership (critical when one user has multiple workplaces).

Optional: `created_by_user_id` where useful for reporting.

**Rationale:** Tables already live in `public`; less disruptive than moving all professional clinical data into per-tenant schemas immediately; enables incremental Option C and tests TC-051, TC-070.

**Non-goal (for first step):** Do **not** move all professional clinical data into tenant-only schemas yet (routing, joins, reporting cost).

---

### 6. Legacy rows without attribution

**Decision:** Treat as **legacy / unattributed** until backfilled or deterministically mapped.

- **Preferred:** Quarantine — hide from normal professional APIs; surface via admin / review / backfill tooling.  
- **Alternative:** Deterministic fallback only when tenant can be derived with high confidence from existing links (e.g. clinic-owned appointment), not “same `doctor_user_id` therefore allow.”

**Matrix (TC-070, TC-071):** Unattributed rows are not fully trusted professional rows until quarantined path or backfill.

**Locked Phase 4 policy (lists, updates, `attribution_status`, backfill execution):** [`docs/architecture-option-c-phase4-design.md`](architecture-option-c-phase4-design.md).

---

### 7. Patient-facing reads vs creation context

**Decision:** Authoritative creation context stays `professional_tenant_id` = issuing workspace. Patient dashboard reads professional-origin records through a **patient-authorized projection / service**, without rewriting operational or creation ownership.

**Matrix:** Patient-facing read model without rewriting authority (TC-040, TC-054).

**Locked patient projection rules:** [`docs/architecture-option-c-phase4-design.md`](architecture-option-c-phase4-design.md) §2.

---

## Short version for direct handoff

> Mediloop should represent accepted memberships in `public.user_tenants` and pending invitations in `public.tenant_invitations`. Each user must have exactly one personal-health tenant, represented by `public.tenants.tenant_type = 'personal_health'` and enforced by `public.personal_health_tenants(user_id, tenant_id)`. JWTs should remain identity-oriented, while the acting context is explicit on every protected request through `X-Mediloop-Tenant-Id` and `X-Mediloop-Membership-Id`; the server must revalidate the membership on every request. Structured auditability should be implemented in `public.audit_events`. For clinical data already stored in `public`, professional-origin rows such as prescriptions and teleconsultations should gain `professional_tenant_id` and `created_by_membership_id`, and legacy rows without tenant attribution must be treated as untrusted until quarantined or deterministically backfilled.

---

## Implementation phases (starter package)

| Phase | Focus |
|-------|--------|
| **1** | `tenant_type` on `public.tenants`; `public.personal_health_tenants`; `public.tenant_invitations`; extend `public.user_tenants`; `public.audit_events` |
| **2** | Identity-only JWT; context headers; membership revalidation per request; audit denied/switch events |
| **3** | `professional_tenant_id` + `created_by_membership_id` on prescriptions, teleconsultations, and other professional-origin tables — apply [`migration_020`](../backend/migrations/migration_020_option_c_phase3_clinical_attribution.sql) and [`migration_021`](../backend/migrations/migration_021_teleconsultation_status_confirmed.sql); see Neon runbook [`docs/runbooks/neon-clinical-option-c-migrations.md`](runbooks/neon-clinical-option-c-migrations.md); list APIs scope doctor/pharmacist by active tenant (NULL = legacy); writes set attribution from active context; CI: `.github/workflows/backend-ci.yml` (`test-backend` + optional phase3 with `TEST_DATABASE_URL`) |
| **4** | Legacy backfill/quarantine rules; patient read contract; wire P0 matrix to real routes — **locked design:** [`docs/architecture-option-c-phase4-design.md`](architecture-option-c-phase4-design.md) |

### Frontend dashboard routing note

- Canonical application dashboard route is `/dashboard` for patient, doctor, and pharmacist entrypoints.
- Role-specific legacy routes (`/doctor/dashboard`, `/pharmacy/dashboard`) are retained as compatibility redirects only and must resolve to canonical dashboard routing behavior.
- Mode persistence (role dashboard vs patient dashboard view for doctor/pharmacist) is handled through frontend state, then resolved by dashboard navigation helpers.

### Phase 1 — apply on database (manual)

After backup, run once per environment:

- File: [`backend/migrations/migration_019_option_c_phase1_schema.sql`](../backend/migrations/migration_019_option_c_phase1_schema.sql)  
- Use Neon SQL Editor, `psql`, or your migration runner.

The script is **additive** (new tables + new columns with safe backfill). Existing APIs that ignore these structures keep working until Phases 2–3.

Greenfield / `scripts/db/schema.sql`: the same objects are included so new databases match.

**Phase 2 (backend, branch `option-c-phase2-request-context`):** after JWT auth, `activeContextMiddleware` resolves acting tenant + membership. If both `X-Mediloop-Tenant-Id` and `X-Mediloop-Membership-Id` are sent, membership is validated against the user and tenant; denials write `public.audit_events` (`action = active_context.denied`). If headers are omitted, legacy resolution uses JWT `tenant_id` and an active `user_tenants` row for that tenant. CORS allows these headers on the API.

---

## Decision summary (CSV-friendly)

```csv
Decision Area,Recommendation,Concrete Choice,Why
Membership lifecycle,Split accepted memberships from invites,"public.user_tenants for accepted; public.tenant_invitations for pending",Avoid half-membership states
Membership statuses,Lifecycle on real memberships only,"active|suspended|revoked|left",Keep pending out of membership source of truth
Personal-health tenant,Type + one-to-one mapping,"tenants.tenant_type=personal_health + personal_health_tenants(user_id, tenant_id)",Strong invariant and lookup
Active context,Explicit per request,"X-Mediloop-Tenant-Id + X-Mediloop-Membership-Id",Multi-tab; explicit switch; no silent guess
JWT scope,Identity-oriented,"sub + session_id + auth claims",Avoid stale embedded tenant
Session role,Default/last context only,"last_active_membership_id / last_active_tenant_id",Login restore; not sole authZ
Audit model,Dedicated table,"public.audit_events",Queryable compliance
Audit writes,Split concern,"middleware auth/context; services domain",Traceability
Clinical attribution,Columns on public rows,"professional_tenant_id on clinical tables",Incremental Option C
Actor attribution,Membership on writes,"created_by_membership_id",Multi-workplace clarity
Legacy rows,Untrusted until fixed,"quarantine or deterministic backfill",No bypass of tenant scope
Patient view,Projection not rewrite,"patient-facing service/view",Preserve creation context
```

---

## Cursor handoff (one row per decision)

```csv
Section,Decision,Implementation Direction
§1 Membership,Accepted memberships in public.user_tenants,Add role/status/is_default/accepted_at/revoked_at as needed
§1 Invitations,Pending outside memberships,Create public.tenant_invitations (pending/accepted/expired/revoked)
§1 Personal tenant,One personal-health tenant per user,Add tenant_type + personal_health_tenants(user_id, tenant_id)
§1 Active context,Context explicit per request,JWT + session + X-Mediloop-Tenant-Id and X-Mediloop-Membership-Id
§1 Audit,Structured audit,public.audit_events; middleware + services
§2 Clinical,Professional rows tenant-qualified,professional_tenant_id on prescriptions/teleconsultations etc.
§2 Actor,Professional writes need membership,created_by_membership_id
§2 Legacy,No full trust without attribution,Quarantine or deterministic backfill
§2 Patient read,Read via authorized projection,Do not rewrite authoritative creation tenant
```

---

## See also

- In-app notification storage, `tenant_id`, and **event type catalog**: [architecture-notifications.md](./architecture-notifications.md)
