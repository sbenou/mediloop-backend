/**
 * Role-Based Access Control (RBAC) Middleware - Database-Driven (Relational Tables)
 *
 * Uses role_categories and role_category_assignments tables for flexible RBAC.
 * Supports both specific role names AND role categories.
 *
 * Tables:
 * - roles: User roles (doctor, nurse, admin, etc.)
 * - role_categories: Category definitions (healthcare_provider, administrative, etc.)
 * - role_category_assignments: Many-to-many junction table
 */

import {
  Context,
  Next,
  Middleware,
} from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

/**
 * Cache for role category lookups to avoid database queries on every request
 * Key: role name, Value: array of category names
 */
const roleCategoryCache = new Map<string, string[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastCacheRefresh = 0;

/**
 * Refresh the role category cache from database
 * Uses JOIN query to fetch roles with their assigned categories
 */
async function refreshRoleCategoryCache(): Promise<void> {
  try {
    const client = await postgresService.getClient();

    if (!client) {
      console.error("[RBAC] Failed to get database client");
      return;
    }

    try {
      // Query to get all roles with their categories
      const result = await client.queryObject<{
        role_name: string;
        categories: string[];
      }>(`
        SELECT 
          r.name AS role_name,
          COALESCE(ARRAY_AGG(rc.name) FILTER (WHERE rc.name IS NOT NULL), '{}') AS categories
        FROM public.roles r
        LEFT JOIN public.role_category_assignments rca ON r.id = rca.role_id
        LEFT JOIN public.role_categories rc ON rca.category_id = rc.id
        GROUP BY r.name
      `);

      roleCategoryCache.clear();
      for (const row of result.rows) {
        roleCategoryCache.set(row.role_name, row.categories || []);
      }

      lastCacheRefresh = Date.now();
      console.log(
        `[RBAC] Role category cache refreshed: ${roleCategoryCache.size} roles loaded`,
      );
    } finally {
      postgresService.releaseClient(client);
    }
  } catch (error) {
    console.error("[RBAC] Error refreshing role category cache:", error);
  }
}

/**
 * Get categories for a role (with caching)
 *
 * @param roleName - Name of the role
 * @returns Array of category names for the role
 */
async function getRoleCategories(roleName: string): Promise<string[]> {
  // Refresh cache if expired
  if (Date.now() - lastCacheRefresh > CACHE_TTL) {
    await refreshRoleCategoryCache();
  }

  // If role not in cache after refresh, query directly
  if (!roleCategoryCache.has(roleName)) {
    try {
      const client = await postgresService.getClient();

      if (!client) {
        console.error("[RBAC] Failed to get database client");
        return [];
      }

      try {
        const result = await client.queryObject<{ category_name: string }>(
          `
          SELECT rc.name AS category_name
          FROM public.roles r
          JOIN public.role_category_assignments rca ON r.id = rca.role_id
          JOIN public.role_categories rc ON rca.category_id = rc.id
          WHERE r.name = $1
        `,
          [roleName],
        );

        const categories = result.rows.map((row) => row.category_name);
        roleCategoryCache.set(roleName, categories);

        return categories;
      } finally {
        postgresService.releaseClient(client);
      }
    } catch (error) {
      console.error(
        `[RBAC] Error fetching categories for role ${roleName}:`,
        error,
      );
      return [];
    }
  }

  return roleCategoryCache.get(roleName) || [];
}

/**
 * Check if a role matches any of the allowed roles or categories
 *
 * @param userRole - User's role name
 * @param allowedRolesOrCategories - Array of allowed role names OR category names
 * @returns True if user's role or any of its categories match
 */
async function isRoleAllowed(
  userRole: string,
  allowedRolesOrCategories: string[],
): Promise<boolean> {
  // Direct role match (fastest check)
  if (allowedRolesOrCategories.includes(userRole)) {
    return true;
  }

  // Check if user's role has any of the required categories
  const userCategories = await getRoleCategories(userRole);
  return allowedRolesOrCategories.some((allowed) =>
    userCategories.includes(allowed),
  );
}

/**
 * Require specific role(s) or category(ies) middleware
 *
 * Must be used after authMiddleware (which sets ctx.state.user)
 *
 * @param allowedRolesOrCategories - Array of allowed role names OR category names
 * @returns Middleware function
 *
 * @example
 * // Allow specific roles
 * requireRole(['admin', 'compliance'])
 *
 * // Allow by category (any role with this category)
 * requireRole(['healthcare_provider'])
 *
 * // Mix of roles and categories
 * requireRole(['admin', 'healthcare_provider', 'compliance'])
 */
export function requireRole(allowedRolesOrCategories: string[]): Middleware {
  return async (ctx: Context, next: Next) => {
    const user = ctx.state.user;

    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Authentication required",
      };
      return;
    }

    const isAllowed = await isRoleAllowed(user.role, allowedRolesOrCategories);

    if (!isAllowed) {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        message: `Access denied. Required role or category: ${allowedRolesOrCategories.join(" or ")}`,
        userRole: user.role, // Include for debugging (remove in production if needed)
      };
      return;
    }

    await next();
  };
}

/**
 * Require admin role middleware
 * Allows only users with 'admin' role (exact match)
 */
export const requireAdmin: Middleware = requireRole(["admin"]);

/**
 * Require compliance role middleware
 * Allows users with admin role OR compliance category
 *
 * Examples:
 * - admin role ✅
 * - compliance_officer role (has compliance category) ✅
 * - auditor role (has compliance category) ✅
 * - doctor role ❌
 */
export const requireCompliance: Middleware = requireRole([
  "admin",
  "compliance",
]);

/**
 * Require healthcare provider middleware
 * Allows any role with 'healthcare_provider' category
 *
 * Examples:
 * - doctor (has healthcare_provider category) ✅
 * - nurse (has healthcare_provider category) ✅
 * - physician_assistant (has healthcare_provider category) ✅
 * - medical_resident (has healthcare_provider category) ✅
 * - admin ❌ (unless also assigned healthcare_provider category)
 *
 * 🎯 NO NEED TO UPDATE THIS when adding new healthcare roles!
 * Just assign the 'healthcare_provider' category to the new role in database:
 *
 * INSERT INTO roles (name, description) VALUES ('new_role', 'Description');
 * INSERT INTO role_category_assignments (role_id, category_id)
 * SELECT r.id, rc.id FROM roles r, role_categories rc
 * WHERE r.name = 'new_role' AND rc.name = 'healthcare_provider';
 */
export const requireHealthcareProvider: Middleware = requireRole([
  "healthcare_provider",
]);

/**
 * Require clinical staff middleware
 * Allows any role with 'clinical_staff' category
 *
 * Examples:
 * - doctor (has clinical_staff + healthcare_provider) ✅
 * - nurse (has clinical_staff + healthcare_provider) ✅
 * - medical_assistant (has clinical_staff only) ✅
 * - lab_technician (has clinical_staff only) ✅
 * - patient ❌
 */
export const requireClinicalStaff: Middleware = requireRole(["clinical_staff"]);

/**
 * Require administrative staff middleware
 * Allows any role with 'administrative' category
 *
 * Examples:
 * - admin ✅
 * - office_manager ✅
 * - billing_admin ✅
 * - compliance_officer (has administrative + compliance) ✅
 * - doctor ❌
 */
export const requireAdministrative: Middleware = requireRole([
  "administrative",
]);

/**
 * Require emergency access middleware
 * Allows any role with 'emergency_access' category
 * Used for break-glass scenarios
 */
export const requireEmergencyAccess: Middleware = requireRole([
  "emergency_access",
]);

/**
 * Manually refresh the role category cache
 * Useful after bulk role/category updates
 *
 * @example
 * // After adding new roles or changing categories
 * await refreshRoleCache();
 */
export async function refreshRoleCache(): Promise<void> {
  await refreshRoleCategoryCache();
}

/**
 * Get all categories for a specific role (utility function)
 * Useful for debugging or admin interfaces
 *
 * @param roleName - Name of the role
 * @returns Array of category names
 */
export async function getRoleCategoriesUtil(
  roleName: string,
): Promise<string[]> {
  return await getRoleCategories(roleName);
}

/**
 * Check if a role has a specific category (utility function)
 *
 * @param roleName - Name of the role
 * @param categoryName - Name of the category
 * @returns True if role has the category
 */
export async function roleHasCategory(
  roleName: string,
  categoryName: string,
): Promise<boolean> {
  const categories = await getRoleCategories(roleName);
  return categories.includes(categoryName);
}

// Initialize cache on module load
refreshRoleCategoryCache().catch((error) => {
  console.error("[RBAC] Failed to initialize role category cache:", error);
});
