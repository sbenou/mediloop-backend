# Async work: BullMQ + Redis vs Deno KV

This project’s clinical APIs run on **Deno** with **Neon Postgres**. Some behaviors that used to live in Supabase Edge Functions are better replaced with explicit job queues or small key-value state.

## BullMQ + Redis

Use when you need **durable, retried background processing** and **visibility** (monitoring, dead-letter, concurrency):

- Sending email / SMS / push after a clinical event (prescription issued, teleconsultation confirmed).
- **Webhooks** to pharmacy systems or CRM with exponential backoff.
- **Heavy or slow** operations: PDF generation, bulk exports, antivirus scan of uploads.
- **Scheduled** work: reminders before teleconsultations, nightly reconciliation reports.
- **Fan-out**: one user action enqueues N independent jobs processed in parallel workers.

Redis backs the queue; BullMQ provides job lifecycle, retries, delays, and repeatable jobs.

## Deno KV (or similar small KV)

Use for **low-volume, latency-sensitive, strongly keyed** data where a full RDBMS or queue is overhead:

- **Idempotency keys** for POST endpoints (“only process this request once”).
- **Feature flags** and per-tenant toggles cached for edge reads.
- **Short-lived locks** or rate-limit buckets (with TTL).
- **Session-adjacent** blobs that do not belong in JWTs (small, non-sensitive hints).

KV is not a substitute for Postgres for **authoritative** clinical records; keep prescriptions, connections, and teleconsultations in Neon.

### HDS / compliance posture

For **HDS-aligned** deployments, **do not** store identifiable clinical data (prescriptions, teleconsultations, doctor–patient links, diagnosis-shaped blobs) in **Deno KV**, Redis caches, or ad-hoc edge KV. Those belong in **Postgres (Neon)** with your retention, audit, and access-control model. KV is appropriate only for **non-clinical** ephemeral data (see below).

### What this backend currently stores in Deno KV (audit)

All of the following are **non-clinical** in the current codebase; **no prescription / teleconsultation / connection rows** are written to KV:

| Area | Location (examples) | Purpose |
|------|---------------------|--------|
| Token rotation / short-lived tokens | `backend/modules/auth/services/tokenRotationService.ts` | Session / rotation metadata, TTL |
| Domain verification tokens | `backend/modules/auth/services/domainVerificationService.ts` | Pending DNS / domain checks |
| Generic KV helpers | `backend/shared/services/kvStore.ts` | Sessions, LuxTrust handoff, location hints (TTL) |

If you add new KV keys, keep them limited to **tokens, locks, idempotency, and config**—not patient care records.

### Token rotation diagnostics (superadmin)

Read-only queue health endpoint for troubleshooting scheduled rotation retries:

- `GET /admin/rotation-queue?limit=200`
- Requires JWT role `superadmin`
- Returns `failedAttempts`, `nextAttemptAt`, `lastError`, `sessionId`, `userId`, `expiresAt`

Example:

```bash
curl -H "Authorization: Bearer <superadmin_jwt>" \
  "http://localhost:8000/admin/rotation-queue?limit=100"
```

### Supabase Edge Functions to retire (wiring checklist)

Complete the Deno routes (or workers) first, then remove invokes. The table in **`docs/auth-v2-migration-checklist.md`** (§7) lists call sites still hitting Edge; summarize:

| Function | Typical replacement |
|----------|---------------------|
| `seed-notifications` | Admin-only backend route or remove in production |
| `create-pharmacy-subscription` | Existing Stripe / payments module on Deno |
| `process-connection-notifications` | BullMQ + worker, or Deno cron + notifications module |
| `get-mapbox-token` | Backend route that returns a server-side token |
| `create-delivery-payment` | Payments routes (`/api/...`) |
| `luxtrust-service` | `backend/modules/auth/routes/luxtrust.ts` (`/api/luxtrust/*`) |
| `convert-points` | Loyalty API on Deno |

**Additional functions in repo (no or few frontend invokes—migrate when touching that product area):** `send-order-email`, `send-templated-email`, `send-login-email`, `send-referral-email`, `send-referral-success-email`, `stripe-webhook`, `teleconsultation-reminders`, `wearable-oauth`, `sync-wearable-data`, `upsert-doctor-workplace`, `token-rotation`, `get-currencies`, `auth-service` (legacy — reference only), `create-fcm-token-table` (one-off / legacy).

## Rule of thumb

- **Neon**: source of truth for clinical and user data.
- **BullMQ + Redis**: “do this later, reliably, possibly many times with backoff.”
- **KV**: “remember this key for a short time or for config; fail-soft if missing.”
