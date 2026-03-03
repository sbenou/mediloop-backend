// ============================================================================
// Organization Member Types for Backend (Deno/TypeScript)
// ============================================================================
// File location: mediloop-backend/src/types/organizationMember.ts
// Description: TypeScript types for the organization_members table
// ============================================================================

/**
 * Member roles within an organization
 */
export type OrganizationRole =
  | "doctor"
  | "nurse"
  | "admin"
  | "receptionist"
  | "pharmacist"
  | "technician"
  | "manager"
  | "other";

/**
 * Organization Member entity - represents a user's membership in an organization
 * Replaces the old DoctorWorkplace type
 */
export interface OrganizationMember {
  id: string;

  // Relationships
  user_id: string;
  organization_id: string;

  // Role and hierarchy
  role_id: string | null; // Will reference tenant schema roles later
  role_name: OrganizationRole | null;

  // Org chart: who does this person report to?
  reports_to: string | null; // References another organization_member.id

  // Primary organization flag
  is_primary: boolean;

  // Employment details
  title: string | null; // Job title: "Senior Cardiologist", "Head Nurse"
  department: string | null; // "Cardiology", "Emergency", "Pharmacy"
  employee_id: string | null; // Organization's internal employee ID

  // Status
  is_active: boolean;
  start_date: string | null; // ISO date string
  end_date: string | null; // ISO date string

  // Permissions (can be moved to role later)
  permissions: MemberPermissions;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Virtual fields (may be added by joins)
  user?: any; // User object when joined
  organization?: any; // Organization object when joined
  manager?: OrganizationMember; // Manager object when reports_to is joined
  direct_reports?: OrganizationMember[]; // Team members reporting to this person
}

/**
 * Member permissions structure
 */
export interface MemberPermissions {
  // Patient management
  can_view_patients?: boolean;
  can_create_patients?: boolean;
  can_edit_patients?: boolean;
  can_delete_patients?: boolean;

  // Appointment management
  can_view_appointments?: boolean;
  can_create_appointments?: boolean;
  can_edit_appointments?: boolean;
  can_cancel_appointments?: boolean;

  // Room bookings
  can_view_bookings?: boolean;
  can_create_bookings?: boolean;
  can_edit_bookings?: boolean;
  can_cancel_bookings?: boolean;

  // Organization management
  can_manage_members?: boolean;
  can_manage_roles?: boolean;
  can_view_reports?: boolean;
  can_manage_settings?: boolean;

  // Additional custom permissions
  [key: string]: boolean | undefined;
}

/**
 * DTO for creating a new organization member
 */
export interface CreateOrganizationMemberDTO {
  user_id: string;
  organization_id: string;
  role_name?: OrganizationRole;
  reports_to?: string;
  is_primary?: boolean;
  title?: string;
  department?: string;
  employee_id?: string;
  start_date?: string;
  permissions?: MemberPermissions;
}

/**
 * DTO for updating an organization member
 */
export interface UpdateOrganizationMemberDTO {
  role_name?: OrganizationRole;
  reports_to?: string;
  is_primary?: boolean;
  title?: string;
  department?: string;
  employee_id?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  permissions?: Partial<MemberPermissions>;
}

/**
 * Organization member with user details (for display)
 */
export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

/**
 * Organization hierarchy node (for org chart)
 */
export interface OrganizationHierarchyNode {
  member: OrganizationMember;
  depth: number;
  children: OrganizationHierarchyNode[];
}

/**
 * Invitation to join an organization
 */
export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  invited_email: string;
  invited_by: string; // user_id
  role_name: OrganizationRole;
  reports_to?: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string;
  created_at: string;
}

/**
 * DTO for inviting a user to an organization
 */
export interface CreateInvitationDTO {
  organization_id: string;
  invited_email: string;
  role_name: OrganizationRole;
  reports_to?: string;
  title?: string;
  department?: string;
  message?: string; // Optional message to include in invitation email
}

/**
 * Member search filters
 */
export interface MemberSearchFilters {
  organization_id?: string;
  role_name?: OrganizationRole | OrganizationRole[];
  department?: string;
  is_active?: boolean;
  search_term?: string; // Search in user name, email, title
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is an OrganizationMember
 */
export function isOrganizationMember(obj: any): obj is OrganizationMember {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.user_id === "string" &&
    typeof obj.organization_id === "string"
  );
}

/**
 * Type guard to check if role is valid
 */
export function isValidRole(role: string): role is OrganizationRole {
  return [
    "doctor",
    "nurse",
    "admin",
    "receptionist",
    "pharmacist",
    "technician",
    "manager",
    "other",
  ].includes(role);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates CreateOrganizationMemberDTO
 */
export function validateCreateMember(
  dto: any,
): dto is CreateOrganizationMemberDTO {
  if (!dto.user_id || typeof dto.user_id !== "string") {
    throw new Error("user_id is required");
  }

  if (!dto.organization_id || typeof dto.organization_id !== "string") {
    throw new Error("organization_id is required");
  }

  if (dto.role_name && !isValidRole(dto.role_name)) {
    throw new Error("Invalid role_name");
  }

  return true;
}

/**
 * Validates that reports_to is not circular
 */
export function validateReportsTo(
  memberId: string,
  reportsToId: string | null,
  allMembers: OrganizationMember[],
): boolean {
  if (!reportsToId) return true;

  // Can't report to yourself
  if (memberId === reportsToId) {
    throw new Error("A member cannot report to themselves");
  }

  // Check for circular reference
  let current = allMembers.find((m) => m.id === reportsToId);
  const visited = new Set<string>([memberId]);

  while (current) {
    if (visited.has(current.id)) {
      throw new Error("Circular reporting structure detected");
    }
    visited.add(current.id);

    if (!current.reports_to) break;
    current = allMembers.find((m) => m.id === current!.reports_to);
  }

  return true;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds organization hierarchy tree from flat list of members
 */
export function buildOrganizationTree(
  members: OrganizationMember[],
): OrganizationHierarchyNode[] {
  const memberMap = new Map<string, OrganizationMember>();
  const rootNodes: OrganizationHierarchyNode[] = [];
  const nodeMap = new Map<string, OrganizationHierarchyNode>();

  // Create map and nodes
  members.forEach((member) => {
    memberMap.set(member.id, member);
    nodeMap.set(member.id, {
      member,
      depth: 0,
      children: [],
    });
  });

  // Build tree structure
  members.forEach((member) => {
    const node = nodeMap.get(member.id)!;

    if (!member.reports_to) {
      // Root node (no manager)
      rootNodes.push(node);
    } else {
      // Child node (has a manager)
      const parentNode = nodeMap.get(member.reports_to);
      if (parentNode) {
        node.depth = parentNode.depth + 1;
        parentNode.children.push(node);
      } else {
        // Parent not found, treat as root
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

/**
 * Gets all members in a reporting chain (member + all their reports recursively)
 */
export function getReportingChain(
  memberId: string,
  allMembers: OrganizationMember[],
): OrganizationMember[] {
  const result: OrganizationMember[] = [];
  const member = allMembers.find((m) => m.id === memberId);

  if (!member) return result;

  result.push(member);

  // Get all direct reports
  const directReports = allMembers.filter((m) => m.reports_to === memberId);

  // Recursively get their reports
  directReports.forEach((report) => {
    result.push(...getReportingChain(report.id, allMembers));
  });

  return result;
}

/**
 * Gets the management chain for a member (member → manager → manager's manager → ...)
 */
export function getManagementChain(
  memberId: string,
  allMembers: OrganizationMember[],
): OrganizationMember[] {
  const result: OrganizationMember[] = [];
  let currentMember = allMembers.find((m) => m.id === memberId);
  const visited = new Set<string>();

  while (currentMember && !visited.has(currentMember.id)) {
    result.push(currentMember);
    visited.add(currentMember.id);

    if (!currentMember.reports_to) break;
    currentMember = allMembers.find((m) => m.id === currentMember!.reports_to);
  }

  return result;
}

/**
 * Gets default permissions for a role
 */
export function getDefaultPermissions(
  role: OrganizationRole,
): MemberPermissions {
  const basePermissions: MemberPermissions = {
    can_view_patients: false,
    can_create_patients: false,
    can_edit_patients: false,
    can_delete_patients: false,
    can_view_appointments: false,
    can_create_appointments: false,
    can_edit_appointments: false,
    can_cancel_appointments: false,
    can_view_bookings: false,
    can_create_bookings: false,
    can_edit_bookings: false,
    can_cancel_bookings: false,
    can_manage_members: false,
    can_manage_roles: false,
    can_view_reports: false,
    can_manage_settings: false,
  };

  switch (role) {
    case "admin":
      return Object.keys(basePermissions).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as MemberPermissions);

    case "doctor":
      return {
        ...basePermissions,
        can_view_patients: true,
        can_create_patients: true,
        can_edit_patients: true,
        can_view_appointments: true,
        can_create_appointments: true,
        can_edit_appointments: true,
        can_cancel_appointments: true,
        can_view_bookings: true,
        can_create_bookings: true,
      };

    case "nurse":
      return {
        ...basePermissions,
        can_view_patients: true,
        can_create_patients: true,
        can_edit_patients: true,
        can_view_appointments: true,
        can_view_bookings: true,
      };

    case "receptionist":
      return {
        ...basePermissions,
        can_view_patients: true,
        can_create_patients: true,
        can_edit_patients: true,
        can_view_appointments: true,
        can_create_appointments: true,
        can_edit_appointments: true,
        can_view_bookings: true,
        can_create_bookings: true,
        can_edit_bookings: true,
      };

    case "pharmacist":
      return {
        ...basePermissions,
        can_view_patients: true,
        can_view_appointments: true,
      };

    case "manager":
      return {
        ...basePermissions,
        can_view_patients: true,
        can_view_appointments: true,
        can_view_bookings: true,
        can_view_reports: true,
        can_manage_members: true,
      };

    default:
      return basePermissions;
  }
}

// ============================================================================
// Constants
// ============================================================================

export const ORGANIZATION_ROLES: { value: OrganizationRole; label: string }[] =
  [
    { value: "doctor", label: "Doctor" },
    { value: "nurse", label: "Nurse" },
    { value: "admin", label: "Administrator" },
    { value: "receptionist", label: "Receptionist" },
    { value: "pharmacist", label: "Pharmacist" },
    { value: "technician", label: "Technician" },
    { value: "manager", label: "Manager" },
    { value: "other", label: "Other" },
  ];

export const INVITATION_EXPIRY_DAYS = 7;
