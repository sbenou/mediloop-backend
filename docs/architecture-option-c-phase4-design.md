# Option C — Phase 4 design (locked for Mediloop)

**Status:** **Locked implementation policy** for Phase 4 (legacy attribution, backfill, patient-facing reads)  
**Depends on:** Phase 3 complete; canonical Option C mechanics in [`architecture-option-c-decisions.md`](architecture-option-c-decisions.md)  
**Purpose:** Ground truth for backend + frontend behavior for this phase. Resolves §6–§7 ambiguities from the decisions file.

**Short practical rule:** Legacy rows with `professional_tenant_id IS NULL` are **excluded** from normal professional workspace-scoped list routes; **standard professional update routes must not mutate** them. Legacy rows are handled through **deterministic backfill** and/or **explicit review tooling**, with an **`attribution_status`** field for reporting and UX. **Pharmacists** follow the **same** policy. **Patient-facing** responses use a **patient-safe projection**; they must **not** expose `professional_tenant_id` or `created_by_membership_id` directly—use display fields (e.g. clinician name, clinic name). Patients may see records **across issuing workspaces** when legitimately linked; viewing does not change authoritative ownership on the row.

**Transition nuance:** If many historic records would cause a sudden “empty list” for professionals, a **short** transition may expose legacy via a **privileged** `include_legacy` or review-only path—not the normal default.

---

## 1. Legacy rows (`professional_tenant_id IS NULL`)

### 1.1 Definitions

| Label | Meaning |
|--------|--------|
| **Attributed** | `professional_tenant_id` is non-NULL (and usually `created_by_membership_id` set on new writes). |
| **Legacy / unattributed** | `professional_tenant_id IS NULL` (and/or missing membership where required). |

### 1.2 Locked policy: quarantine by default

- Legacy rows are **not** treated as normal workspace-scoped professional artifacts until attributed or explicitly handled.
- **Do not** keep “NULL visible in all workspaces for that doctor” beyond a very short transition; that undermines Option C.

### 1.3 Professional GET lists (doctor / pharmacist)

| Rule | Decision |
|------|----------|
| Normal list routes | Return **only attributed** rows (active workspace scope applies as today for attributed data). |
| Legacy (`professional_tenant_id IS NULL`) | **Hidden** from standard workspace-scoped lists. |
| Exposure | Only via **admin/review** routes or a dedicated **“Unassigned / Review”** bucket for **privileged** users. |

### 1.4 Professional updates (PATCH / PUT)

| Rule | Decision |
|------|----------|
| Normal professional routes | **Block** updates to legacy / unattributed rows. |
| Rationale | Avoid mutating rows as if workspace ownership were clear; prevents silent wrong-workspace semantics. |
| Exception | Only via an **explicit admin/review** flow that **attributes** or **quarantines** the row first. |

### 1.5 Pharmacist reads

**Same policy as doctors** (or stricter over time, but not looser): normal workspace lists show **only attributed** rows; legacy goes to **review/admin** only. Keeps rules simple and defensible.

### 1.6 `attribution_status` (explicit column — Option B)

Add `attribution_status` on professional-origin clinical tables (aligned with migrations for `prescriptions`, `teleconsultations`, `doctor_patient_connections`, and any other tables using the same attribution model).

| Value | Meaning |
|-------|--------|
| `attributed` | Trusted for **normal** scoped professional APIs. |
| `legacy_pending` | Old row; not yet resolved / not deterministically backfilled. |
| `quarantined` | **Explicitly** blocked from normal use until manual or admin action. |

**Rationale:** Dashboards, admin tooling, migration reporting, support, and enforcement are clearer than inferring everything from NULL tenant alone. **Mediloop adopts this explicitly.**

**Note:** Migrations must define defaults/backfill for existing rows (e.g. NULL tenant → `legacy_pending` or `quarantined` per policy).

### 1.7 Backfill policy (what may be auto-filled)

| Allowed | Not allowed |
|--------|-------------|
| **Deterministic** attribution with an **explainable** rule (e.g. single authoritative workplace link, single unambiguous membership relation, one trusted timestamped workplace at creation—**as documented per table**) | **Guessing** from `doctor_user_id` when multiple workplaces could apply (“pick one”) |

**Product stance:** Some history may stay **unresolved** for a while; **wrong attribution is worse** than unknown.

### 1.8 Acceptance criteria (implementation)

- [ ] LIST / UPDATE behavior for NULL `professional_tenant_id` implemented and documented in API changelog.  
- [ ] `attribution_status` added and kept consistent with list/update rules.  
- [ ] Backfill runbook + execution plan (§2.5) followed.  
- [ ] Tests (TC-070 / TC-071 style) updated to match this policy.

---

## 2. Patient-facing reads

### 2.1 Principle

**Authoritative creation context** stays on the row (`professional_tenant_id`, membership ids). Patient views **do not** change ownership.

### 2.2 Patient-safe projection layer

Patients read through:

- **Dedicated serializers / projection services**, and/or  
- A dedicated namespace later, e.g. `/api/patient/clinical/...` (**recommended medium term**; **not** mandatory on day one if existing routes are hardened).

**Rule:** Patient-visible payloads are a **filtered representation**, not the raw professional row shape.

### 2.3 What to expose vs withhold

| Withhold from patient JSON | Expose instead (examples) |
|----------------------------|---------------------------|
| `professional_tenant_id`, `created_by_membership_id` (and similar internal ids) | Issuing **clinician display name**, **organization display name** where relevant, **issue date**, **content** the patient is allowed to see |
| — | Optional: `issued_by_workspace_name` (human-readable, e.g. “Clinique Saint-Pierre”) |

### 2.4 Cross-tenant professional history (patient)

**Yes:** a patient may see professional-origin rows from **any** clinician/workspace that **legitimately** treated them.

**Rule:** Visibility is based on **patient linkage** to the row and **authorization for that resource type**—**not** on the **currently active professional tenant** of whoever is calling the API (patient context is separate).

### 2.5 Backfill execution plan

**Ownership**  
Backfill runs are executed only by **authorized engineering/admin** personnel, not by normal application users.

**First execution environment**  
Backfill is tested first on a **Neon branch**, **staging clone**, or other **non-production** environment. Production runs only after validation.

**Dry run**  
The backfill tool should support a **dry-run** mode that reports:

- rows eligible for deterministic attribution  
- rows unresolved  
- rows skipped  
- reasons  

**Audit / logging**  
Each backfill run must record:

- run id  
- timestamp  
- operator  
- table / resource name  
- row id  
- old values  
- new values  
- attribution rule used  

This may be written to **`audit_events`**, and/or a **dedicated backfill log table** / structured migration log.

**Rollback**  
Rollback must be possible using recorded **old/new** values per changed row (row id, old values, new values, timestamp, job run id).

**Safety rule**  
Rows that **cannot** be attributed deterministically must remain **`legacy_pending`** or **`quarantined`** and must **not** be auto-attributed.

### 2.6 Acceptance criteria (patient path)

- [ ] Documented patient read matrix (resource × role × fields returned).  
- [ ] Tests TC-040 / TC-054 (or equivalents) aligned; no raw internal attribution ids in patient JSON.

---

## 3. Sequencing after this design

1. Apply [`backend/migrations/migration_023_option_c_phase4_attribution_status.sql`](../backend/migrations/migration_023_option_c_phase4_attribution_status.sql) (`attribution_status` + triggers + CHECKs).  
2. Implement LIST / UPDATE policy for legacy rows (routes + serializers + tests) — see [`architecture-option-c-phase4-implementation-checklist.md`](architecture-option-c-phase4-implementation-checklist.md).  
3. Admin/review (or privileged “Unassigned”) surfaces for legacy rows.  
4. Backfill tool: dry-run, logging, optional `audit_events` integration.  
5. Patient projections / route hardening per §2; optional `/api/patient/clinical/...` later.  
6. Update public API / Postman docs for behavior changes.

---

## 4. References

- [`docs/architecture-option-c-decisions.md`](architecture-option-c-decisions.md) — §6 Legacy rows, §7 Patient reads, memberships, headers, audit  
- [`docs/architecture-option-c-phase4-implementation-checklist.md`](architecture-option-c-phase4-implementation-checklist.md) — **route-by-route** tasks after **023**  
- [`docs/runbooks/neon-clinical-option-c-migrations.md`](runbooks/neon-clinical-option-c-migrations.md) — migration order through **023**  
- `.github/workflows/backend-ci.yml` — `test-backend` + optional Phase 3 with `TEST_DATABASE_URL`

---

## Appendix A — Mediloop Phase 4 addendum (product & platform model)

**Reconciliation with [`architecture-option-c-decisions.md`](architecture-option-c-decisions.md):**  
Option C **schema and API mechanics** (memberships, `user_tenants` vs `tenant_invitations`, header-based active context, `audit_events` shape, `tenant_type` taxonomy such as `personal_health`, `clinic`, `doctor_cabinet`, `hospital`, `pharmacy`) remain **canonical** in the decisions document where already specified. This appendix extends **product rules** and **DSP/workspace UX** for implementers; if a subsection below uses looser wording (e.g. “organization” for tenant type), map it to the concrete enum values in migrations and the decisions doc.

### 0. Purpose (appendix)

This appendix:

- finalizes cross-cutting Phase 4 product context  
- integrates workspace + DSP + multi-tenant care model narratives  
- supplements the **locked** rules in §§1–2 above (which govern **immediate** backend list/update/patient JSON behavior)

### 1. Membership + lifecycle (summary)

**Decision:** Use existing **`public.user_tenants`** for accepted memberships. **Pending** invite flow stays on **`tenant_invitations`** (see decisions doc for status enums: `user_tenants` uses **active** memberships for API; do not conflate invitation pending with stored membership semantics).

**Rule:** Only **active** (usable) memberships participate in normal professional API authorization.

### 2. Personal Health tenant (summary)

**Decision:** **`tenants.tenant_type`**, **`personal_health_tenants`** (or equivalent), one personal-health tenant per user, created at signup / onboarding, used when the user acts in **patient** workspace. (Details: decisions doc §1.2.)

### 3. Active context (critical summary)

**Decision:** JWT carries identity (`sub`, `session_id`, …); **active professional workspace** is **not** inferred solely from JWT—use **explicit headers** (`X-Mediloop-Tenant-Id`, `X-Mediloop-Membership-Id`) and **session** as in the decisions doc. **Revalidate** membership on every protected request.

### 4. Audit (summary)

**Decision:** **Clinical writes** log **who** acted, **which tenant**, **which membership**, via **`audit_events`** (or equivalent structured audit). Backfill runs log per-row old/new values as in §2.5.

### 5. Clinical data attribution (summary)

**Decision:** **`professional_tenant_id`** and **`created_by_membership_id`** on professional-origin clinical tables; every **new** professional write carries tenant + membership context. **Legacy** handling: **§1** of this document.

### 6. DSP (Dossier Médical Partagé) model — core principle

- **Doctors interact with the clinical / DSP layer**, not with a raw “full user dump” in APIs.  
- **Identity layer** (`auth.users`): login, email, auth.  
- **Clinical layer:** prescriptions, consultations, observations—**tenant-scoped** where professional.  
- **Rule:** Professional APIs **read/write clinical data** with **minimal identity projection** (e.g. name, contact where needed)—**not** expose full internal user model shapes inappropriately.

### 7. Workspace model (UX-level)

| Layer | Role |
|--------|------|
| **Personal Health** | Full patient UI; patient’s own health workspace. |
| **Professional personal workspace** | Account-level: workplaces, invitations, global schedule, profile, signature. |
| **Tenant workspace** | Cabinet / hospital / pharmacy: tenant-scoped patients, consultations, prescriptions, operations. |

**Rule:** **Workspace switch = full UI switch** (including navigation). **No cross-tenant clinical data inside a tenant workspace**; cross-tenant views belong in the **professional personal** surface where product allows.

### 8. Doctor vs owner (inside tenant)

| Role | Typical visibility |
|------|-----------------|
| **Cabinet owner** | Broad tenant visibility (policies as product defines). |
| **Doctor** | Own patients, consultations, prescriptions, availability within tenant rules. |
| **Professional workspace** | Cross-tenant schedule, workplaces, invitations, profile—not mixed into tenant-scoped lists. |

**Rule:** No cross-tenant **data** inside **tenant** clinical lists; cross-tenant only where the **professional workspace** product explicitly allows.

### 9. Professional profile split

- **User-level professional profile:** doctor info, credentials, signature, workplaces.  
- **Tenant profile:** cabinet info, staff, settings.

### 10. Patient-facing reads (reinforced)

- Patient sees records **across tenants** when legitimately linked (**§2.4**).  
- **Do not** expose raw `tenant_id` / `membership_id` to patients; use **display** fields (**§2.3**).  
- **Viewing does not change ownership** (**§2.1**).

### 11. Pharmacy recurring prescription model (directional)

- **Do not** mutate **prescription ownership** for “recurring” flows; preserve **immutable origin** (creating clinic/doctor context).  
- **Dispensation** (e.g. monthly) is modeled on a **separate** dispensation row/table with `pharmacy_tenant_id`, membership, signature, stamp, note as product/schema evolve.  
- **Mapping note (FHIR-oriented):** Prescription → MedicationRequest; dispensation → MedicationDispense.

### 12. Final rule (appendix)

**Every professional action belongs to exactly one tenant context**, even if the **patient** spans many tenants in their personal health view.

---

**End of document.**
