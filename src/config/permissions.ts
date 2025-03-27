
/**
 * Centralized permission constants to ensure consistent usage across the application
 */

export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD: {
    VIEW: "view_dashboard",
    MANAGE: "manage_dashboard",
  },
  
  // Product management permissions
  PRODUCTS: {
    VIEW: "view_products",
    CREATE: "create_products",
    EDIT: "edit_products",
    DELETE: "delete_products",
  },
  
  // Order management permissions
  ORDERS: {
    VIEW: "view_orders",
    MANAGE: "manage_orders",
  },
  
  // Prescription management permissions
  PRESCRIPTIONS: {
    VIEW: "view_prescriptions",
    MANAGE: "manage_prescriptions",
  },
  
  // Settings permissions
  SETTINGS: {
    VIEW: "view_settings",
    MANAGE: "manage_settings",
  },
  
  // Admin permissions
  ADMIN: {
    VIEW: "view_admin",
    MANAGE_ROLES: "manage_roles",
    MANAGE_USERS: "manage_users",
  },
};

// For TypeScript intellisense
export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionSubKey<T extends PermissionKey> = keyof typeof PERMISSIONS[T];
export type PermissionValue = string;
