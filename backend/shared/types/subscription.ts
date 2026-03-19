// **Purpose:** Subscription plans & organization subscriptions

import { PlanWithFeatures, Feature } from "./feature.ts";

export enum PlanStatus {
  ACTIVE = "active",
  DEPRECATED = "deprecated",
  ARCHIVED = "archived",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export interface Plan {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: PlanStatus;
  is_public: boolean;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  display_order: number;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  trial_ends_at: Date | null;
  current_period_start: Date;
  current_period_end: Date;
  cancelled_at: Date | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionFeatureOverride {
  id: string;
  subscription_id: string;
  feature_id: string;
  override_value: string;
  reason: string | null;
  expires_at: Date | null;
  created_at: Date;
}

// Enriched types
export interface SubscriptionWithPlan extends Subscription {
  plan: PlanWithFeatures;
  feature_overrides: Array<SubscriptionFeatureOverride & { feature: Feature }>;
}

// DTOs
export interface CreateSubscriptionDTO {
  organization_id: string;
  plan_key: string;
  status?: SubscriptionStatus;
  trial_days?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubscriptionDTO {
  plan_key?: string;
  status?: SubscriptionStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateFeatureOverrideDTO {
  subscription_id: string;
  feature_key: string;
  override_value: string;
  reason?: string;
  expires_in_days?: number;
}

export interface SubscriptionFilters {
  organization_id?: string;
  plan_id?: string;
  status?: SubscriptionStatus;
  active_only?: boolean;
}

// **Sources:**
// - `/phase2-types.ts` (Plan, Subscription, SubscriptionFeatureOverride)
// - `/types/subscriptionTypes.ts` (MERGE & consolidate)
