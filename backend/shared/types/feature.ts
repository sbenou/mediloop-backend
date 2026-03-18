// **Purpose:** Technical features (rate limits, storage, capacity)

import { Plan } from "./subscription.ts";
import { Service } from "./service.ts";

export enum FeatureCategory {
  RATE_LIMITING = "rate_limiting",
  STORAGE = "storage",
  CAPACITY = "capacity",
  API_ACCESS = "api_access",
  INTEGRATIONS = "integrations",
}

export interface Feature {
  id: string;
  name: string;
  key: string;
  category: FeatureCategory;
  description: string | null;
  default_value: string;
  value_type: "integer" | "boolean" | "string" | "json";
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  value: string;
  created_at: Date;
}

export interface PlanWithFeatures extends Plan {
  features: Array<Feature & { pivot_value: string }>;
  services: Array<Service & { pivot_quantity: number }>;
}

// DTOs
export interface CreateFeatureDTO {
  name: string;
  key: string;
  category: FeatureCategory;
  description?: string;
  default_value: string;
  value_type: "integer" | "boolean" | "string" | "json";
  metadata?: Record<string, unknown>;
}

export interface UpdateFeatureDTO {
  name?: string;
  description?: string;
  default_value?: string;
  metadata?: Record<string, unknown>;
}

// **Sources:**
// - `/phase2-types.ts` (Feature, PlanFeature)
