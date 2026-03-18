// **Purpose:** Custom error classes

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public resetAt: Date,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "EXPIRED" | "SUSPENDED" | "INVALID_PLAN",
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export class PlanError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "DUPLICATE_KEY"
      | "INVALID_FEATURE"
      | "INVALID_SERVICE",
  ) {
    super(message);
    this.name = "PlanError";
  }
}

export class TenantError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "ALREADY_EXISTS" | "INVALID_SCHEMA",
  ) {
    super(message);
    this.name = "TenantError";
  }
}

// **Sources:**
// - `/phase2-types.ts` (RateLimitError, SubscriptionError, PlanError)
// - `/types/subscriptionTypes.ts` (duplicate error classes)
