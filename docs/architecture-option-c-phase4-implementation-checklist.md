# Phase 4 — implementation checklist (Mediloop)

**Policy:** [`architecture-option-c-phase4-design.md`](architecture-option-c-phase4-design.md)  
**Migration:** [`backend/migrations/migration_023_option_c_phase4_attribution_status.sql`](../backend/migrations/migration_023_option_c_phase4_attribution_status.sql)  
**Apply order:** [`runbooks/neon-clinical-option-c-migrations.md`](runbooks/neon-clinical-option-c-migrations.md) (steps **1–6**, including **023**)

Use this list when wiring routes, serializers, and tooling after **023** is applied.

---

## 1. Database (done by migration 023)

| Item | Notes |
|------|--------|
| Enum `public.clinical_attribution_status` | `attributed`, `legacy_pending`, `quarantined` |
| Column `attribution_status` | On `prescriptions`, `teleconsultations`, `doctor_patient_connections`, `NOT NULL`, default `legacy_pending` |
| Backfill | Rows with `professional_tenant_id IS NOT NULL` → `attributed` |
| CHECK | `attributed` ⇔ non-null tenant; `legacy_pending` / `quarantined` ⇔ null tenant |
| Trigger `sync_clinical_attribution_status` | On INSERT / `professional_tenant_id` UPDATE: if tenant set → `attributed` (so existing Phase 3 `INSERT`s keep working without listing the column) |
| Partial indexes | `*_attribution_status_review` for `legacy_pending` / `quarantined` (admin / review lists) |

**Optional later:** explicit `public.clinical_backfill_runs` + row-level log table per [`architecture-option-c-phase4-design.md`](architecture-option-c-phase4-design.md) §2.5.

---

## 2. Replace `TENANT_SCOPE` (professional lists)

**Today** (`clinical.ts`):  
`(professional_tenant_id IS NULL OR professional_tenant_id = $tenant)` — legacy rows leak into every workspace.

**Phase 4 default:** attributed rows only, active tenant match:

```sql
AND alias.professional_tenant_id = $tenant::uuid
AND alias.attribution_status = 'attributed'::clinical_attribution_status
```

**Apply to:**

| Method | Path | Roles |
|--------|------|--------|
| GET | `/api/prescriptions` | `doctor`, `pharmacist` |
| GET | `/api/prescriptions/:id` | `doctor`, `pharmacist` (paths that use `TENANT_SCOPE`) |
| GET | `/api/teleconsultations` | `doctor`, `pharmacist` |
| PATCH | `/api/teleconsultations/:id` | `doctor` branch (resolve row in scope) |
| GET | `/api/clinical/doctor-patient-connections` | `doctor`, `pharmacist` |

**Patient** list routes: unchanged linkage (`patient_id = self`); then apply **§3** serializers (do not expose internal ids).

**Short transition:** if product requires it, gated query flag or header (e.g. review-only) may include `legacy_pending` / `quarantined` — not the default for standard workspace lists.

---

## 3. Block mutating legacy / unattributed rows (professional)

For **PUT/PATCH/DELETE** that today use `TENANT_SCOPE` with “legacy OR same tenant”, add a guard:

- If row has `professional_tenant_id IS NULL` **or** `attribution_status <> 'attributed'`, respond **409** (or **403**) with a stable error code, e.g. `legacy_row_not_mutable`, unless the caller uses a future **admin/review** route.

| Method | Path | Notes |
|--------|------|--------|
| PUT | `/api/prescriptions/:id` | Doctor only |
| DELETE | `/api/prescriptions/:id` | Doctor only |
| PATCH | `/api/teleconsultations/:id` | Doctor branch (patient cancel-only may still need policy: if row is legacy, define whether patient can cancel) |
| PATCH | `/api/clinical/doctor-patient-connections/:id` | Doctor / patient per current rules |

**POST** creates with tenant + membership: trigger sets `attributed`; optionally still list `attribution_status` in `INSERT` for clarity.

---

## 4. Review / admin surfaces (new or extended)

| Need | Suggestion |
|------|-----------|
| List legacy / quarantined | Query `attribution_status IN ('legacy_pending','quarantined')` (+ join doctor / tenant display), **privileged** role or admin API |
| Attribute row | Transaction: set `professional_tenant_id`, `created_by_membership_id`, rely on trigger for `attributed`, or set explicitly |
| Quarantine | Set `attribution_status = 'quarantined'`, keep `professional_tenant_id IS NULL` (or future policy for “blocked with tenant” if product ever needs it — would require relaxing CHECK / new migration) |

Document routes in API changelog; align with `audit_events` for writes.

---

## 5. Patient-safe projections

| Route | Current shape | Phase 4 target |
|--------|----------------|----------------|
| GET `/api/prescriptions` (`role=patient`) | `{ prescriptions: result.rows }` raw `p.*` | Map to DTO: **omit** `professional_tenant_id`, `created_by_membership_id`; add **display** fields (`issued_by_workspace_name`, etc.) via joins to `tenants` / profiles as available |
| GET `/api/prescriptions/:id` | Same | Same |
| GET `/api/teleconsultations` (patient) | Raw rows | Same pattern |
| PATCH `/api/teleconsultations/:id` (patient) | Response body | Patient-facing subset only |

**Medium term:** `/api/patient/clinical/...` namespace — share the same mappers.

---

## 6. Types & frontend contract

| Task | Location |
|------|----------|
| TypeScript / OpenAPI types | Add `attribution_status` where professional APIs return full rows; **omit** on patient DTOs |
| Admin UI | Columns for status + filters |
| `src/services/clinicalApi.ts` | Align payloads after serializers change |

---

## 7. Backfill executable (separate from 023)

023 only adds schema + backfill **attributed** where tenant already present.

**Follow-up tool** (script or job):

- Dry-run: counts eligible / skipped / unresolved (see design §2.5)
- Deterministic rules only; log run id, operator, row id, old/new values, rule id
- Writes `audit_events` and/or backfill log table
- Staging → production order; rollback procedure documented

---

## 8. Tests

| Area | Cases |
|------|--------|
| Phase 3 suite | After changing `TENANT_SCOPE`, update expectations: legacy rows **not** in doctor/pharmacist default lists |
| New | Doctor list excludes `legacy_pending` / `quarantined` for other tenants |
| New | PUT prescription with legacy row → 409/403 |
| New | Patient JSON body **no** internal tenant/membership ids |
| Migration | CI already applies 018–023 when `TEST_DATABASE_URL` is set; add Phase 4 tests or extend `clinicalPhase3.test.ts` as needed |

---

## 9. Order of work (suggested)

1. Apply **023** on dev / Neon branch; smoke-test existing **POST** clinical flows (trigger keeps inserts valid).  
2. Change **GET** list queries (`TENANT_SCOPE` replacement).  
3. Add **mutation guards** on PUT/PATCH/DELETE.  
4. Introduce **patient mappers** + tests.  
5. Ship **review/admin** read path, then **backfill** tool.  
6. Optional: namespace `/api/patient/clinical/...` reusing mappers.

---

## 10. Phase 5A (read-only legacy review) — implemented

- **GET** [`/api/admin/legacy-clinical`](../backend/modules/admin/routes/legacyClinicalReview.ts) — superadmin only; filters `resource`, `attribution_status`, `limit`, `offset`; audit `admin.legacy_clinical.list`.
- **UI:** [`/superadmin/legacy-clinical`](../src/pages/superadmin/LegacyClinicalReviewPage.tsx) — link from superadmin dashboard.
- **Runbook:** [`runbooks/phase5a-legacy-clinical-review.md`](runbooks/phase5a-legacy-clinical-review.md).

Next: Phase 5B dry-run backfill script, then Phase 5C minimal mutations (see your Phase 5 proposal).

---

## References

- [`architecture-option-c-decisions.md`](architecture-option-c-decisions.md) — Phase 4 row in implementation table  
- [`backend/modules/clinical/routes/clinical.ts`](../backend/modules/clinical/routes/clinical.ts) — all routes using `TENANT_SCOPE` today
