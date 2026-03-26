# Postman — Mediloop Backend

## Import

1. Postman → **Import** → choose `Mediloop-Backend.postman_collection.json`.
2. Open the collection → **Variables**:
   - `baseUrl` — e.g. `http://localhost:8000`
   - `accessToken` — paste JWT after login (or from verify-email response)
   - Optionally `tenantId` + `membershipId` (**both** or neither): UUIDs for Option C workspace context. A collection pre-request script sends `X-Mediloop-*` headers only when both are set.

## Regenerate from source

After adding routes, update `scripts/generate-postman-collection.mjs` and run:

```bash
node scripts/generate-postman-collection.mjs
```
