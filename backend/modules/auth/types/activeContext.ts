export type ActiveContextSource = "request_headers" | "legacy_jwt_membership";

/** Resolved acting workspace for Option C (after auth, per request). */
export interface ResolvedActiveContext {
  tenantId: string;
  membershipId: string;
  tenantRole: string;
  source: ActiveContextSource;
}
