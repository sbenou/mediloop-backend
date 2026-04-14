# Phase 5A — Legacy clinical review (read-only)

**Purpose:** Make `attribution_status` and legacy / quarantine rows **visible** to superadmin for dev, QA, and product alignment—**no mutations** in this slice.

## Prerequisites

- Migration **`023`** applied (`attribution_status` on clinical tables).
- Backend running with JWT auth; caller must have **`superadmin`** in the JWT `role` claim.

## API

`GET /api/admin/legacy-clinical`

| Query param | Values | Default |
|-------------|--------|---------|
| `resource` | `all`, `prescriptions`, `teleconsultations`, `connections` | `all` |
| `attribution_status` or `status` | `default` / `queue` (legacy_pending + quarantined), `legacy_pending`, `quarantined`, `attributed`, comma list, `all` | queue |
| `limit` | 1–500 | 100 |
| `offset` | ≥ 0 | 0 |

**Response:** `{ rows, count, limit, offset, filters }` — each row includes resource type, ids, patient/clinician display names, tenant name (if any), `attribution_status`, summary.

**Auth:** `Authorization: Bearer <jwt>` (workspace headers optional).

**Audit:** Successful list records `admin.legacy_clinical.list` in `public.audit_events` (best-effort).

## UI

- Route: **`/superadmin/legacy-clinical`**
- Requires logged-in user with **superadmin** profile (same gate as other superadmin pages).
- Link from **`/superadmin/dashboard`**.

## What this is not

- No PATCH/POST from this page (Phase 5C).
- Not a full admin console.

## Related

- Policy: [`docs/architecture-option-c-phase4-design.md`](../architecture-option-c-phase4-design.md)
- Implementation notes: [`docs/architecture-option-c-phase4-implementation-checklist.md`](../architecture-option-c-phase4-implementation-checklist.md)
