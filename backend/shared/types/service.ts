// **Purpose:** Professional services (onboarding, training, support)

export enum ServiceCategory {
  ONBOARDING = "onboarding",
  TRAINING = "training",
  SUPPORT = "support",
  CONSULTING = "consulting",
  CUSTOM_DEVELOPMENT = "custom_development",
}

export interface Service {
  id: string;
  name: string;
  key: string;
  category: ServiceCategory;
  description: string | null;
  is_recurring: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface PlanService {
  id: string;
  plan_id: string;
  service_id: string;
  quantity: number;
  created_at: Date;
}

// DTOs
export interface CreateServiceDTO {
  name: string;
  key: string;
  category: ServiceCategory;
  description?: string;
  is_recurring: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateServiceDTO {
  name?: string;
  description?: string;
  is_recurring?: boolean;
  metadata?: Record<string, unknown>;
}

// **Sources:**
// - `/phase2-types.ts` (Service, PlanService)
