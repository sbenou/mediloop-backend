# Architecture: in-app notifications (Mediloop)

**Status:** Working agreement for implementers  
**Scope:** Event taxonomy, storage shape, and how this relates to per-tenant tables.

## Storage model

- **Baseline inbox table:** `backend/migrations/migration_012_notifications.sql` — creates `public.notifications` (`user_id` → `auth.users`, optional legacy `tenant_id`, `title`, `body`, `data`, read timestamps, etc.).
- **Scoped / compliance extensions:** `backend/migrations/migration_027_notifications_option_c_scope.sql` — run **immediately after 012** for production-shaped Mediloop. Adds **`scope_type`**, **`scope_tenant_id`**, **`scope_membership_id`**, **`workspace_kind`**, **`category`**, **`event_type`**, **`body_preview`**, **`contains_sensitive_health_data`**, **`status`**, archive/expiry, resource pointers, **`dedupe_key`**, plus **`public.notification_deliveries`** and **`public.notification_preferences`**. Foreign keys to `public.tenants` and `public.user_tenants` are added only if those tables exist (apply Option C **019** before 027 on the same database so scoping FKs apply).
- **Tenant template (SchemaManager):** Per-tenant `notifications` remains separate from this pipeline; the app uses **`public.notifications`** for the unified inbox.

**Apply order (notifications):** `012` → (recommended: `019` Option C phase 1 so `tenants` / `user_tenants` exist) → **`027`** → **`028`** (patient PH links; optional but recommended) → run **professional PH backfill** once if the DB has pre-change doctors/pharmacists (`deno task backfill-professional-personal-health`).

### Why professional vs personal-health inboxes do not “mix”

Rows are separated by **`scope_type`** and **`scope_tenant_id`** (and optional **`scope_membership_id`** for tenant rows):

- **Workplace (clinic / pharmacy)** notifications use **`scope_type = tenant`** and the **workplace tenant UUID**. They appear only when the active workspace headers match that tenant (and membership when set).
- **Personal health** notifications use **`scope_type = personal_health`** and the **personal-health tenant UUID** (from `personal_health_tenants`). They appear only when the user selects that PH workspace (or auto-inbox when the active tenant is the PH tenant).
- **`professional_personal`** is a third stream for cross-workspace items; list/mark-read require explicit **`inbox=professional_personal`**.

So a doctor or pharmacist does not see workplace bell items while in the PH workspace, and does not see PH inbox items while in the pharmacy/clinic workspace, **as long as** producers set scope correctly (and the user has a PH workspace — registration + **028** + professional backfill). The Node notification worker fills scope from **`notification.dbScope`** when provided, otherwise from the recipient’s **primary membership** (workplace vs PH tenant type).

**Convention:** Prefer the **`event_type`** column (after 027); keep **`data` JSONB** for display-safe deep-link metadata. **`body_preview`** should stay minimal for lists and push/email previews (data minimization).

**Compliance note:** Migration 027 **does not** replace server-side authorization. **`GET /api/notifications/history`** and **`POST /api/notifications/mark-read`** enforce **JWT identity** and **workspace / inbox scope** on the route layer (see below).

## Event type catalog

Add new types here when introducing producers (referrals, billing, staff, etc.). Use `snake_case`.

### Tenant / org and people

| `event_type` | Meaning |
|--------------|--------|
| `staff_member_invited` | A user was invited to the tenant |
| `staff_member_joined` | Invite accepted / user linked to tenant |
| `staff_member_removed` | User removed from tenant |
| `role_changed` | User’s role in the tenant was updated |

### Referrals

| `event_type` | Meaning |
|--------------|--------|
| `referral_invited` | Referee informed that a named referrer invited them to Mediloop |
| `referral_registered` | Referrer notified that the referee created an account |
| `referral_subscribed` | Referrer notified that the referee subscribed to a plan |
| `referral_reward_granted` | Referrer notified of reward (e.g. loyalty points) |

### Subscription and billing

| `event_type` | Meaning |
|--------------|--------|
| `subscription_started` | Plan became active |
| `subscription_renewed` | Renewal succeeded |
| `subscription_canceled` | Subscription ended or cancel scheduled |
| `payment_failed` | Payment failed (often surfaced as an “alert”) |
| `invoice_available` | Invoice or receipt available |

### Commerce (when applicable)

| `event_type` | Meaning |
|--------------|--------|
| `order_placed` | New order relevant to the tenant |
| `order_shipped` | Order dispatched |
| `order_delivered` | Order delivered |
| `delivery_failed` | Delivery failed |
| `delivery_late` | Delivery delayed |

### Clinical / professional (optional)

| `event_type` | Meaning |
|--------------|--------|
| `prescription_received` | e.g. pharmacy-facing |
| `connection_request` | Doctor–patient connection requested |
| `connection_accepted` | Connection accepted |

### System / account

| `event_type` | Meaning |
|--------------|--------|
| `security_new_device` | Sign-in from a new device (if implemented) |
| `email_verified` | Email verification completed |

## Compliance and product alignment (summary)

External advice (GDPR / CNIL-style framing) lines up with how we should treat notifications:

- **Compliance is about access scope and data minimization**, not about “one table per tenant.” Weak authorization fails either way; strong scoping on a shared table is a standard pattern.
- **Notifications should be inbox pointers**, not the system of record for clinical detail: short `title` / preview text; sensitive payloads live behind authorized APIs after navigation.
- **Option C:** a notification row must only appear when the user’s **active workspace context** matches the row’s **scope** (personal health vs professional personal vs tenant). Never show a tenant-scoped row in the wrong workspace just because the recipient `user_id` matches.

## Implemented schema (012 + 027)

After **`migration_027`**, `public.notifications` includes everything in the target blueprint except a rename of `user_id` (kept for compatibility; documented as recipient). **`notification_deliveries`** and **`notification_preferences`** are created by 027.

### Read and mark-read authorization (Option C)

A user may **list** or **mark read** a notification only if:

1. `user_id` = authenticated user (`sub`), and  
2. The resolved **`inbox`** (query param on GET; optional **`inbox`** field on POST JSON body; omitted = **auto**: personal-health tenant vs workplace tenant) **matches** the row’s **scope** the same way as history filters. Use explicit **`inbox=professional_personal`** when reading professional-personal rows so auto-inbox does not assume workplace **tenant**.

**Examples**

- Personal health: `scope_type = personal_health`, `scope_tenant_id` = personal-health tenant; use **`inbox=personal_health`** with active context = that tenant.
- Professional personal: `scope_type = professional_personal`; use **`inbox=professional_personal`** on both list and mark-read when the active workspace is a workplace tenant.
- Tenant: `scope_type = tenant`, `scope_tenant_id` + optional membership; workplace inbox from **`X-Mediloop-*`** headers.

**`GET /api/notifications/history`** rejects a **`userId`** query that does not match **`sub`** (403). **`POST /api/notifications/mark-read`** returns **404** if the id does not exist for that user, **403** if the row is not visible in the resolved inbox for the current context, and **200** with **`alreadyRead`** when `read_at` was already set.

### Splitting tables by purpose (not by tenant)

Prefer **inbox vs deliveries vs preferences** (027) over per-tenant physical notification tables unless legal mandates schema isolation.

## Related code

- Migrations: `backend/migrations/migration_012_notifications.sql`, `backend/migrations/migration_027_notifications_option_c_scope.sql`
- HTTP routes: `backend/modules/notifications/routes/notifications.ts`
- Personal-health workspace provisioning: `backend/modules/auth/services/personalHealthWorkspaceService.ts` (registration + professional backfill)
- Integration tests: `tests/backend/notificationsScoped.test.ts` (requires 012 + 027 on `TEST_DATABASE_URL`)
- Tenant DDL template: `backend/shared/services/postgres/SchemaManager.ts` (`notifications` in tenant schema)

## See also

- Multi-tenant context and clinical attribution: [architecture-option-c-decisions.md](./architecture-option-c-decisions.md)
