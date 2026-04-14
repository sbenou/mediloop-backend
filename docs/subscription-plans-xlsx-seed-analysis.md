# Analysis: seeding subscription plans from `mediloop_exact_plans_en.xlsx`

This document describes what the workbook contains, how it maps to the current database and app, and what to implement for the **full seed pipeline**. **Display marketing copy:** **option B (normalized tables)** — agreed over metadata JSON.

**Seed order (implementation assumption):** the script must ensure, in order:

1. **`public.features`** — all **technical** keys referenced by the workbook (existing rows updated if needed, missing keys inserted with sensible `value_type` / defaults).  
2. **`public.services`** — all **service catalog** rows that plans will reference (existing or new `key`s).  
3. **`public.plans`** — one row per plan (plus **`metadata`** for role, marketing copy or pointers).  
4. **`public.plan_features`** — link each plan to features with per-plan **values**.  
5. **`public.plan_services`** — link each plan to services with **quantities**.

Marketing bullets (display lines) are **not** `features.key` rows; they live in **normalized tables** (§2.1). Technical enforcement still comes from **`features` + `plan_features`**.

**Product note:** Even before Clinic/Hospital dashboards and routes exist, **seeding Clinic and Hospital plans** (and a **Hospital placeholder** if the workbook lacks priced tiers) is valuable so pricing and entitlements do not block later work.

---

## 1. Workbook structure (tabs)

| Sheet | Purpose |
|--------|---------|
| **Overview** | Summary: role → list of plan names; Hospital noted as “role-oriented matrix only” (no priced tier list like other roles). |
| **Patient Plans** | 4 rows: Essential, Prevention+, Family Active, Health Premium — price (€/mo), target audience, **Displayable Features** (bulleted text), **Displayable Services** (bulleted text), **Hidden / Technical Features** (machine keys, one per line). |
| **Doctor Plans** | 4 rows: Solo, Cabinet Pro, Cabinet AI, Cabinet Max — same column pattern. |
| **Pharmacist Plans** | 5 rows: Base Pharma → Pharma Max — same pattern. |
| **Clinic Plans** | 5 rows: Clinic Start → Clinic Enterprise — same pattern. |
| **Hospital Role** | Single row for **Hospital**: only **Displayable Features** and **Displayable Services** (no per-plan prices, no per-plan technical block on this tab). |
| **Visible Feature Matrix** | ~117 displayable feature labels × columns Patient / Doctor / Pharmacist / Clinic / Hospital (Yes/empty). Cross-check / source for “which roles see which marketing feature.” |
| **Hidden Technical Matrix** | ~18 rows: key `Role:PlanName` (e.g. `Patient:Essential`) → full technical feature key list (duplicate of per-row “Hidden / Technical” on role sheets, useful as canonical merge target). |

**Totals**

- **18 priced plans** (4+4+5+5) with explicit technical feature lists.
- **Hospital**: marketing lists only; product decision needed (institutional quotes vs placeholder plans vs exclude from self-serve UI).

---

## 2. What “seed” must achieve (product + technical)

1. **Plans in Postgres** (`public.plans`)  
   - One row per priced plan with stable **`key`** (e.g. `patient_essential`, `doctor_cabinet_pro`), **`name`**, **`description`**, prices, **`display_order`**, **`status`**, **`is_public`**.  
   - **`metadata` JSONB** should carry at least: **`target_role`** (or `role`) — `patient` | `doctor` | `pharmacist` | `clinic` | `hospital` — plus UI strings (badge, tagline, **primary target** from sheet, etc.).

2. **Technical / enforceable configuration** (`public.plan_features`)  
   - Links each plan to rows in **`public.features`** with a **value** (string/JSON as today).  
   - Source: **Hidden / Technical** columns on role sheets **and/or** **Hidden Technical Matrix** (should be kept in sync; script can treat matrix as authoritative if you prefer).

3. **Displayable features & services (marketing copy)** — **Decision: option B (normalized tables)**  
   - Sheet bullets are **human-readable lines**, not `features.key`. They are stored in dedicated rows (§2.1), not in `plans.metadata` blobs.  
   - **Visible Feature Matrix** can **validate** coverage or feed a **comparison** endpoint; it is not automatically identical to per-plan bullet lists.

### 2.1 Normalized marketing tables (implementation sketch)

Single table is enough to start; split later if needed.

**`public.plan_marketing_items`** (name can be adjusted in migration)

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | `gen_random_uuid()` |
| `plan_id` | UUID FK → `plans(id)` | `ON DELETE CASCADE` |
| `sort_order` | INT NOT NULL | Display order within the plan |
| `kind` | VARCHAR / enum | `feature` \| `service` (marketing line type; independent of `plan_services`) |
| `label` | TEXT NOT NULL | Single bullet line (strip leading `•` in seed) |
| `visibility` | VARCHAR NOT NULL DEFAULT `'card'` | e.g. `card` (main list), `expandable` (technical/marketing “more detail”), `comparison_only` (matrix-driven rows if you ingest the Visible matrix separately) |
| `locale` | VARCHAR(16) DEFAULT `'en'` | Optional v1 default English; add rows per locale later |
| `created_at` / `updated_at` | TIMESTAMPTZ | Standard |

**Indexes:** `(plan_id, sort_order)`, `(plan_id, kind)`.

**Seed:** parse Excel “Displayable Features” / “Displayable Services” into **one row per non-empty line**; set `kind` accordingly; default `visibility` = `card` unless you tag some lines as expandable.

**API:** extend plan-with-details responses to `LEFT JOIN plan_marketing_items … ORDER BY sort_order` so the frontend can build `DisplayPlan.displayFeatures` / `displayServices` / `technicalFeatures` from `visibility` + `kind` (mapping rules in the API layer).

4. **Services: why “map” sheet text to `services.key`?**  

   `public.plan_services` stores **`(plan_id, service_id, quantity)`** — it points at **`public.services`** by **foreign key**, not at free text. So the Excel phrase **“Self-Service Onboarding”** must become either:

   - **Reuse** an existing catalog row (recommended when the meaning matches), or  
   - **Insert** a new row in **`public.services`** with a new stable **`key`**, then link it from **`plan_services`**.

   **Example — reuse (map label → existing key)**  

   | Excel line (Displayable Services) | Existing `services.key` (from current seed) | `plan_services` row |
   |-----------------------------------|---------------------------------------------|----------------------|
   | Self-Service Onboarding | `onboarding_basic` | `quantity: 1` |
   | Email Support | `support_email_standard` | `quantity: 1` |
   | Priority Support | `support_email_priority` | `quantity: 1` |
   | Premium Onboarding | `onboarding_premium` | `quantity: 1` |
   | Dedicated Account Manager | `support_account_manager` | `quantity: 1` |

   The seed keeps **one** canonical service; many plans reference it with different quantities if needed.

   **Example — add new catalog row (when nothing fits)**  

   | Excel line | New row in `public.services` | Then in `plan_services` |
   |------------|------------------------------|-------------------------|
   | Monthly Webinars | `key: training_monthly_webinars`, `name: Monthly Webinars`, category TRAINING | `quantity: 1` |
   | Compliance Review | `key: consulting_compliance_review_light` | `quantity: 1` |

   A small **YAML/JSON mapping file** in the repo should list `excel_label → services.key` so the seed is deterministic and you can adjust without editing code.

5. **Role-scoped pricing UI**  

   - After registration, the API should return **only plans where `metadata.target_role` matches the user’s role** (and/or membership context).  
   - That is **API + frontend** work **in addition** to seeding (filter on `GET /plans` or dedicated endpoint).

6. **`DisplayPlan.technicalFeatures` vs `displayFeatures` (frontend)**  
   - Types already allow **technical vs marketing** split (`src/types/planTypes.ts`).  
   - The seed/API should expose enough structure (metadata + plan_features categories or explicit flags) so the UI can show **marketing bullets** by default and **technical** behind “Show details”.

---

## 3. Gaps vs current `features` catalog

The workbook references many **technical keys that do not exist** in `seedSubscriptionSystem.ts` / migration **015** today, for example:

| Workbook (examples) | Current catalog (examples) |
|---------------------|----------------------------|
| `rate_limit_register` | `rate_limit_registration` |
| `rate_limit_token_refresh`, `rate_limit_email_verify_resend`, `rate_limit_email_send`, `rate_limit_sms_send` | Not present |
| `rate_limit_api_burst`, `rate_limit_api_sustained`, `rate_limit_api_daily`, `rate_limit_data_read`, `rate_limit_data_write`, `rate_limit_file_upload` | Not present (only generic `rate_limit_api`) |
| `max_patient_records`, `max_prescriptions_per_month`, `max_staff_members`, `max_doctors` | Partial overlap (`max_patients`, `max_users`, …) — **different semantics** |
| `storage_gb`, `max_file_size_mb`, `storage_retention_days` | `storage_limit_gb`, `storage_document_upload_mb` — **naming mismatch** |

**Required decisions**

1. **Canonical key set**: align spreadsheet to existing keys **or** extend `public.features` (and backend enforcement) with new keys.  
2. **Value format**: many rate limits in the app are **JSON**; the sheet does not specify numeric limits per plan for every key — you may need **defaults per tier** in the seed or a follow-up column in Excel.  
3. **Dead keys**: if a key is seeded but nothing reads it yet, document as “future enforcement.”

---

## 4. Hospital role

- **Overview** says hospital is “matrix only”; **Hospital Role** tab lists display features/services but **no priced tiers** in the workbook sample and **no `Hospital:*` rows** in **Hidden Technical Matrix**.  
- **Recommendation (aligned with product):** seed at least **one placeholder plan** for `target_role: hospital` (e.g. `hospital_enterprise` or `hospital_contact_sales`) with **metadata** (copy from Hospital Role tab), **minimal or conservative `plan_features`** (reuse generic rate limits / caps until institutional tiers are defined), and **`is_public`** / CTA flags suitable for “contact us” — so schema, API filters, and future dashboard work do not require a second seed pass. Refine when Excel adds real tiers.

---

## 5. Implementation approach for the seed script

1. **Input**  
   - **Preferred**: export stable **CSVs** from Excel (one per sheet) committed to `backend/data/subscription-plans/` **or** a build step that converts `.xlsx` → JSON (Deno does not read xlsx natively; use Python/Node one-off or `deno run` calling `python`).  
   - **Alternative**: runtime dependency on `openpyxl` via subprocess from Deno.

2. **Ordering**  
   - Ensure **`features`** (and **`services`**) exist **before** `plans` / `plan_features` / `plan_services`.  
   - Upsert **plans by `key`**, then replace or upsert **junction rows** (avoid duplicates; respect `UNIQUE` constraints).

3. **Coexistence with current seed**  
   - Today **`seedSubscriptionSystem.ts`** seeds **starter / professional / enterprise** (generic).  
   - Decide: **replace** those for dev/test, **keep both** (different keys), or **deprecate** generic plans in UI only.

4. **Idempotency & safety**  
   - Same patterns as current subscription seed: check-by-key or `ON CONFLICT` where applicable.  
   - Document whether production runs this automatically or only dev/staging.

5. **Tests**  
   - Smoke: count plans per role, required keys present for one plan per role, API filter returns only matching role.

---

## 6. Checklist (agreed)

**Status:** Agreed — these seven items are the correct scope to resolve **during** the seed implementation (no change to the list itself).

1. **Stable `plans.key`** — e.g. `{role}_{slug}` (`patient_essential`, `doctor_cabinet_pro`, …); lock in the seed PR.  
2. **Displayable bullets** — **B (normalized)** per §2.1; add migration + API joins.  
3. **Feature key alignment** — spreadsheet keys vs existing `features.key`; rename Excel and/or extend `public.features` in the same change set.  
4. **Service label → `services.key` mapping** — committed mapping file (YAML/JSON) + reuse vs new `services` rows per §2 item 4.  
5. **Hospital** — follow **§4**: at least one **placeholder** plan for `hospital` until the workbook adds tiers.  
6. **`starter` / `professional` / `enterprise`** — keep, hide in UI-only, or stop seeding for new envs; decide in seed PR.  
7. **Input pipeline** — prefer **CSV/JSON in git** (§5); optional `.xlsx` → export step.

**Implementation deliverables:** migration for **`plan_marketing_items`** (§2.1), new/updated **`features`** rows, **label → `services.key`** mapping, **xlsx → CSV/JSON** (or equivalent), **ordered seed**: `features` → `services` → `plans` → `plan_features` → `plan_services` → **`plan_marketing_items`**, and API updates to expose marketing lines to the frontend.
