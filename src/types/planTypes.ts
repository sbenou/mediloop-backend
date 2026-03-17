// ============================================================================
// Plan Types - Frontend TypeScript Definitions
// ============================================================================
// Description: Type definitions for subscription plans, features, and services
// Author: Mediloop Team - Phase 3 Dynamic Plans Implementation
// Date: 2026-03-13
// ============================================================================

/**
 * User roles supported by the platform
 * Stored in database - can be extended dynamically
 */
export type UserRole = string; // 'patient' | 'doctor' | 'pharmacist' | 'clinic' | 'hospital' | ...

/**
 * Feature display categories for grouping in UI
 * Stored in database - can be extended dynamically
 */
export type FeatureDisplayCategory = string; // 'capacity' | 'team' | 'storage' | 'consultation' | ...

/**
 * Service display categories for grouping in UI
 * Stored in database - can be extended dynamically
 */
export type ServiceDisplayCategory = string; // 'onboarding' | 'training' | 'support' | 'consulting' | ...

/**
 * Feature definition from database
 */
export interface Feature {
  id: string;
  feature_key: string;
  name: string;
  description: string | null;
  category: string;
  default_value: Record<string, any>;
  display_order: number;
  is_active: boolean;

  // Business display columns
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

  created_at: string;
  updated_at: string;
}

/**
 * Service definition from database
 */
export interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string | null;
  category: string;
  metadata: Record<string, any>;
  is_active: boolean;

  // Business display columns
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

  created_at: string;
  updated_at: string;
}

/**
 * Plan feature association (from plan_features junction table)
 */
export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  is_visible_in_ui: boolean;
  feature_value_override: Record<string, any> | null;
  sort_order: number;

  // Joined feature data
  feature?: Feature;
}

/**
 * Plan service association (from plan_services junction table)
 */
export interface PlanService {
  id: string;
  plan_id: string;
  service_id: string;
  is_visible_in_ui: boolean;
  service_value_override: Record<string, any> | null;
  sort_order: number;

  // Joined service data
  service?: Service;
}

/**
 * Subscription plan definition
 */
export interface SubscriptionPlan {
  id: string;
  role: UserRole;
  plan_name: string;
  monthly_price_eur: number | null;
  target_audience: string | null;
  is_active: boolean;

  // Legacy fields (for backward compatibility)
  name?: string;
  display_name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;

  created_at: string;
  updated_at: string;

  // Associated features and services
  features?: PlanFeature[];
  services?: PlanService[];
}

/**
 * Grouped plans by role (for UI display)
 */
export interface PlansByRole {
  role: UserRole;
  plans: SubscriptionPlan[];
}

/**
 * API response for fetching plans
 */
export interface FetchPlansResponse {
  success: boolean;
  data: SubscriptionPlan[];
  message?: string;
}

/**
 * API response for fetching plans by role
 */
export interface FetchPlansByRoleResponse {
  success: boolean;
  data: PlansByRole;
  message?: string;
}

/**
 * Feature value types (for type-safe feature values)
 */
export type FeatureValue =
  | { enabled: boolean }
  | { value: number }
  | {
      per_minute?: number;
      per_hour?: number;
      per_day?: number;
      per_15min?: number;
      per_5min?: number;
    }
  | Record<string, any>;

/**
 * Helper type for display-ready features (business-oriented only)
 */
export interface DisplayFeature extends Feature {
  value: FeatureValue;
  is_included: boolean;
}

/**
 * Helper type for display-ready services (business-oriented only)
 */
export interface DisplayService extends Service {
  is_included: boolean;
}

/**
 * Plan for display in pricing cards
 */
export interface DisplayPlan extends SubscriptionPlan {
  displayFeatures: DisplayFeature[];
  displayServices: DisplayService[];
  technicalFeatures?: DisplayFeature[]; // Hidden by default, expandable
  highlight?: string; // e.g., "Most Popular", "Best Value"
  cta?: string; // Call-to-action text
}
