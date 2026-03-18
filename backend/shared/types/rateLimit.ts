// **Purpose:** Rate limiting configuration & usage
import { SubscriptionStatus } from "./subscription.ts";

export interface RateLimitConfig {
  endpoint: string;
  max_requests: number;
  window_seconds: number;
  enabled: boolean;
}

export interface OrganizationLimits {
  organization_id: string;
  subscription_id: string;
  plan_key: string;
  plan_name: string;
  status: SubscriptionStatus;
  rate_limits: {
    [endpointKey: string]: RateLimitConfig;
  };
  storage_limit_gb: number;
  max_patients: number;
  max_users: number;
  api_access_enabled: boolean;
  trial_ends_at: Date | null;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset_at: Date;
  window_seconds: number;
  retry_after_seconds?: number;
}

export interface RateLimitUsage {
  id: string;
  organization_id: string;
  feature_key: string;
  endpoint_key: string;
  ip_address: string | null;
  request_count: number;
  window_start: Date;
  window_end: Date;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

// Query filters
export interface RateLimitUsageFilters {
  organization_id?: string;
  feature_key?: string;
  endpoint_key?: string;
  start_date?: Date;
  end_date?: Date;
}

// **Sources:**
// - `/phase2-types.ts` (RateLimitConfig, OrganizationLimits, etc.)
// - `/types/subscriptionTypes.ts` (RateLimitResult, RateLimitCheck)
