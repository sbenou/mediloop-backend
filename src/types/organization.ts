// ============================================================================
// Organization Types for Backend (Deno/TypeScript)
// ============================================================================
// File location: mediloop-backend/src/types/organization.ts
// Description: TypeScript types for the organizations table
// ============================================================================

/**
 * Organization types supported by the system
 */
export type OrganizationType =
  | "cabinet" // Doctor's office/private practice
  | "clinic" // Medical clinic
  | "hospital" // Hospital
  | "pharmacy" // Pharmacy
  | "other"; // Other healthcare facility

/**
 * Organization entity - represents any healthcare facility
 * Replaces the old Workplace and Pharmacy types
 */
export interface Organization {
  id: string;

  // Basic Information
  name: string;
  organization_type: OrganizationType;
  description: string | null;

  // Contact Information
  phone: string | null;
  email: string | null;
  website: string | null;

  // Address Information
  address: string;
  city: string;
  postal_code: string;
  country: string;

  // Location (for mapping)
  latitude: number | null;
  longitude: number | null;

  // Operating Hours
  hours: string | null; // e.g., "Mon-Fri 9am-5pm"

  // Multi-tenant specific
  tenant_schema_name: string | null; // PostgreSQL schema for this tenant

  // Metadata (flexible JSON for type-specific fields)
  metadata: OrganizationMetadata;

  // Status
  is_active: boolean;
  verified: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Virtual fields (may be added by joins)
  is_primary?: boolean; // Set when fetching user's organizations
}

/**
 * Metadata structure for different organization types
 */
export interface OrganizationMetadata {
  // Pharmacy-specific
  license_number?: string;
  accepts_insurance?: boolean;
  is_24h?: boolean;

  // Hospital-specific
  bed_count?: number;
  trauma_level?: "I" | "II" | "III" | "IV" | "V";
  emergency_services?: boolean;

  // Clinic-specific
  specialties?: string[]; // ['cardiology', 'pediatrics', etc.]

  // Cabinet-specific
  doctor_specialization?: string;
  appointment_duration?: number; // Default appointment duration in minutes

  // Additional custom fields
  [key: string]: any;
}

/**
 * DTO for creating a new organization
 */
export interface CreateOrganizationDTO {
  name: string;
  organization_type: OrganizationType;
  description?: string;

  phone?: string;
  email?: string;
  website?: string;

  address: string;
  city: string;
  postal_code: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  hours?: string;

  metadata?: OrganizationMetadata;
}

/**
 * DTO for updating an existing organization
 */
export interface UpdateOrganizationDTO {
  name?: string;
  organization_type?: OrganizationType;
  description?: string;

  phone?: string;
  email?: string;
  website?: string;

  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  hours?: string;

  metadata?: Partial<OrganizationMetadata>;

  is_active?: boolean;
  verified?: boolean;
}

/**
 * Organization with member count (for admin views)
 */
export interface OrganizationWithStats extends Organization {
  member_count: number;
  active_member_count: number;
  booking_count: number;
}

/**
 * Organization search filters
 */
export interface OrganizationSearchFilters {
  organization_type?: OrganizationType | OrganizationType[];
  city?: string;
  is_active?: boolean;
  verified?: boolean;
  search_term?: string; // Search in name, description, address
}

/**
 * Pagination params for organization queries
 */
export interface OrganizationPaginationParams {
  page?: number;
  limit?: number;
  sort_by?: "name" | "created_at" | "updated_at" | "city";
  sort_order?: "asc" | "desc";
}

/**
 * Paginated organization response
 */
export interface PaginatedOrganizations {
  data: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is an Organization
 */
export function isOrganization(obj: any): obj is Organization {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.organization_type === "string" &&
    ["cabinet", "clinic", "hospital", "pharmacy", "other"].includes(
      obj.organization_type,
    )
  );
}

/**
 * Type guard to check if organization type is valid
 */
export function isValidOrganizationType(
  type: string,
): type is OrganizationType {
  return ["cabinet", "clinic", "hospital", "pharmacy", "other"].includes(type);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates CreateOrganizationDTO
 */
export function validateCreateOrganization(
  dto: any,
): dto is CreateOrganizationDTO {
  if (!dto.name || typeof dto.name !== "string") {
    throw new Error("Name is required and must be a string");
  }

  if (!isValidOrganizationType(dto.organization_type)) {
    throw new Error("Invalid organization_type");
  }

  if (!dto.address || typeof dto.address !== "string") {
    throw new Error("Address is required");
  }

  if (!dto.city || typeof dto.city !== "string") {
    throw new Error("City is required");
  }

  if (!dto.postal_code || typeof dto.postal_code !== "string") {
    throw new Error("Postal code is required");
  }

  return true;
}

/**
 * Sanitizes organization data before sending to client
 */
export function sanitizeOrganization(org: Organization): Organization {
  // Remove sensitive data if needed
  const sanitized = { ...org };

  // Example: Remove internal fields
  // delete sanitized.tenant_schema_name; // Uncomment if you don't want clients to see this

  return sanitized;
}

// ============================================================================
// Constants
// ============================================================================

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] =
  [
    { value: "cabinet", label: "Doctor Cabinet" },
    { value: "clinic", label: "Clinic" },
    { value: "hospital", label: "Hospital" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "other", label: "Other" },
  ];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
