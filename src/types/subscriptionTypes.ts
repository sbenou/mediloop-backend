/**
 * Subscription Plan System Types
 * TypeScript interfaces for the subscription plan system
 * UPDATED: Matches NEW database schema with business display columns
 */

// ============================================================================
// Type Aliases (Flexible - no enums!)
// ============================================================================

// User roles - stored in database, can be extended dynamically
export type UserRole = string; // 'patient' | 'doctor' | 'pharmacist' | 'clinic' | 'hospital' | 'admin' | ...

// Feature categories - stored in database, can be extended dynamically
export type FeatureCategory = string; // 'rate_limit' | 'storage' | 'capacity' | 'functionality' | ...

// Service categories - stored in database, can be extended dynamically
export type ServiceCategory = string; // 'support' | 'onboarding' | 'training' | 'consulting' | 'integration' | 'additional' | ...

// Service delivery types - stored in database, can be extended dynamically
export type ServiceDeliveryType = string; // 'ongoing' | 'one_time' | 'on_demand' | ...

// Subscription statuses - stored in database, can be extended dynamically
export type SubscriptionStatus = string; // 'trial' | 'active' | 'cancelled' | 'expired' | 'suspended' | ...

// Billing periods - stored in database, can be extended dynamically
export type BillingPeriod = string; // 'monthly' | 'yearly' | 'one_time' | ...

// Feature display categories - stored in database, can be extended dynamically
export type FeatureDisplayCategory = string; // 'capacity' | 'team' | 'storage' | 'consultation' | ...

// Service display categories - stored in database, can be extended dynamically
export type ServiceDisplayCategory = string; // 'onboarding' | 'training' | 'support' | 'consulting' | ...

// ============================================================================
// Feature Interfaces
// ============================================================================

export interface Feature {
  id: string;
  feature_key: string;
  name: string;
  description: string | null;
  category: FeatureCategory;
  default_value: Record<string, any>; // JSONB - flexible structure
  is_active: boolean;
  display_order: number;

  // NEW: Business display columns (from migration 007)
  is_business_oriented: boolean;
  is_public: boolean;
  display_name: string | null;
  marketing_description: string | null;
  display_category: FeatureDisplayCategory | null;
  target_roles: UserRole[];
  is_comparable: boolean;
  public_display_order: number;
  icon_name: string | null;
  help_text: string | null;
  learn_more_url: string | null;

  created_at: Date;
  updated_at: Date;
}

// Specific feature value types for better type safety
export interface RateLimitValue {
  per_minute?: number;
  per_5min?: number;
  per_15min?: number;
  per_hour?: number;
  per_day?: number;
}

export interface CapacityValue {
  value: number; // Max count
}

export interface StorageValue {
  value: number; // GB or MB
}

export interface FunctionalityValue {
  enabled: boolean;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  delivery_type: ServiceDeliveryType;
  estimated_hours: number | null;
  is_active: boolean;
  display_order: number;
  metadata: Record<string, any>;

  // NEW: Business display columns (from migration 007)
  is_business_oriented: boolean;
  is_public: boolean;
  display_name: string | null;
  marketing_description: string | null;
  display_category: ServiceDisplayCategory | null;
  target_roles: UserRole[];
  is_comparable: boolean;
  public_display_order: number;
  icon_name: string | null;
  help_text: string | null;
  learn_more_url: string | null;

  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Plan Interfaces (NEW SCHEMA)
// ============================================================================

export interface SubscriptionPlan {
  id: string;

  // Core identification (from original migration)
  plan_key: string; // e.g., 'patient_essential', 'doctor_solo'
  name: string; // e.g., 'Essential', 'Solo'
  description: string | null;

  // Status and visibility
  status: string; // 'active', 'deprecated', 'archived'
  is_public: boolean;

  // Pricing (in cents)
  monthly_price_cents: number | null;
  annual_price_cents: number | null;

  // Display
  display_order: number;

  // Metadata (JSONB) - contains target_role, billing_period, trial_period_days, etc.
  metadata: Record<string, any>;

  // NEW: Business display columns (from migration 007)
  role: UserRole | null; // 'patient', 'doctor', 'pharmacist', 'clinic', 'hospital'
  plan_name: string | null; // 'Essential', 'Pro', 'Enterprise'
  monthly_price_eur: number | null;
  target_audience: string | null;

  // Legacy fields (kept for backward compatibility)
  price?: number; // Deprecated: use monthly_price_cents instead
  currency?: string; // Deprecated: assume EUR
  billing_period?: BillingPeriod; // Deprecated: stored in metadata
  trial_period_days?: number; // Deprecated: stored in metadata
  is_active?: boolean; // Deprecated: use status instead
  is_featured?: boolean; // Deprecated: stored in metadata
  tagline?: string | null; // Deprecated: use target_audience instead
  highlight_features?: string[] | null; // Deprecated

  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Junction Table Interfaces
// ============================================================================

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  value: Record<string, any> | null; // Can override default_value
  metadata: Record<string, any> | null;

  // NEW: Display columns (from migration 007)
  is_visible_in_ui: boolean;
  sort_order: number;
  feature_value_override: Record<string, any> | null;

  created_at: Date;
  updated_at?: Date;
}

export interface PlanService {
  id: string;
  plan_id: string;
  service_id: string;
  metadata: Record<string, any> | null;

  // NEW: Display columns (from migration 007)
  is_visible_in_ui: boolean;
  sort_order: number;
  service_value_override: Record<string, any> | null;

  created_at: Date;
}

// ============================================================================
// User Subscription Interfaces
// ============================================================================

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  trial_start: Date | null;
  trial_end: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  custom_features: Record<string, any> | null;
  custom_services: Record<string, any> | null;
  external_subscription_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Rate Limiting Interfaces
// ============================================================================

export interface RateLimitUsage {
  id: string;
  user_id: string | null;
  ip_address: string;
  endpoint: string;
  count_per_minute: number;
  count_per_5min: number;
  count_per_15min: number;
  count_per_hour: number;
  count_per_day: number;
  window_start: Date;
  last_request_at: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Usage Tracking Interfaces
// ============================================================================

export interface SubscriptionUsage {
  id: string;
  subscription_id: string;
  feature_key: string;
  current_usage: number;
  usage_limit: number | null; // null = unlimited
  period_start: Date;
  period_end: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Composite/View Interfaces
// ============================================================================

export interface PlanFeatureDetail {
  feature_key: string;
  name: string;
  category: FeatureCategory;
  value: Record<string, any>;

  // NEW: Include business display fields
  display_name?: string | null;
  marketing_description?: string | null;
  is_business_oriented?: boolean;
  icon_name?: string | null;
}

export interface PlanServiceDetail {
  service_key: string;
  name: string;
  category: ServiceCategory;
  delivery_type: ServiceDeliveryType;
  quantity?: number;

  // NEW: Include business display fields
  display_name?: string | null;
  marketing_description?: string | null;
  is_business_oriented?: boolean;
  icon_name?: string | null;
}

export interface PlanDetails extends SubscriptionPlan {
  features: PlanFeatureDetail[];
  services: PlanServiceDetail[];
}

export interface UserSubscriptionDetails extends UserSubscription {
  plan: PlanDetails;
}

// ============================================================================
// Rate Limit Configuration Interface
// ============================================================================

export interface RateLimitConfig {
  auth: {
    login: number; // per 15min
    register: number; // per hour
    passwordReset: number; // per hour
    otpRequest: number; // per 15min
    otpVerify: number; // per 15min
    tokenRefresh: number; // per 5min
  };
  communication: {
    emailSend: number; // per hour
    smsSend: number; // per hour
    emailVerifyResend: number; // per hour
  };
  data: {
    read: number; // per minute
    write: number; // per minute
    upload: number; // per hour
  };
  api: {
    burst: number; // per minute
    sustained: number; // per hour
    daily: number; // per day
  };
}

// ============================================================================
// Helper Types for Plan Creation
// ============================================================================

export interface CreatePlanInput {
  plan_key: string;
  name: string;
  description?: string;
  role: UserRole; // NEW: Direct role field
  plan_name?: string; // NEW: Plan name within role

  // Pricing
  monthly_price_cents?: number;
  annual_price_cents?: number;
  monthly_price_eur?: number; // For convenience

  // Status
  status?: string;
  is_public?: boolean;

  // Display
  display_order?: number;
  target_audience?: string;

  // Metadata (flexible)
  metadata?: Record<string, any>;

  // Associations
  feature_ids?: string[]; // Features to include
  service_ids?: string[]; // Services to include
  feature_overrides?: Record<string, Record<string, any>>; // feature_id => custom_value
  service_quantities?: Record<string, number>; // service_id => quantity
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  status?: string;
  is_public?: boolean;
  monthly_price_cents?: number;
  annual_price_cents?: number;
  monthly_price_eur?: number;
  target_audience?: string;
  display_order?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Rate Limit Check Result
// ============================================================================

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

// ============================================================================
// Subscription Usage Check Result
// ============================================================================

export interface UsageCheckResult {
  allowed: boolean;
  feature_key: string;
  current_usage: number;
  usage_limit: number | null;
  remaining: number | null;
  percentage_used: number;
}

// ============================================================================
// Plan Comparison
// ============================================================================

export interface PlanComparison {
  feature_key: string;
  feature_name: string;
  category: FeatureCategory;
  plans: Record<string, any>; // plan_key => value
}

// ============================================================================
// NEW: Plan Entitlements (Phase 2 - Structure Only)
// ============================================================================

export interface PlanEntitlement {
  id: string;
  plan_id: string;
  feature_id: string;
  is_included: boolean; // Whether the feature is available at all
  created_at: Date;
  updated_at: Date;
}
