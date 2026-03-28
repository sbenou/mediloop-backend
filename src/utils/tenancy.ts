import { sql } from "@/lib/database";
import { buildAuthHeaders, MEDILOOP_API_BASE } from "@/lib/activeContext";

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  schema: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  customDomain?: string;
  domainVerified?: boolean;
}

export interface DomainVerification {
  id: string;
  tenantId: string;
  domain: string;
  verificationToken: string;
  verificationMethod: string;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  attempts: number;
  lastAttemptAt?: string;
  verifiedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get tenant domain from hostname or user ID with custom domain support
 */
export const getTenantFromHostname = (hostname: string): string | null => {
  // For preview environments in Lovable
  if (hostname.includes('lovable.app')) {
    // Check if this is a direct tenant parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    if (tenantParam) {
      return tenantParam;
    }
    
    console.log('Running in Lovable preview environment - will use user-based tenant');
    // For preview environments, return null to use user-based tenant lookup
    return null;
  }
  
  // For development environments
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Allow testing with localhost:5173?tenant=example
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    return tenantParam;
  }
  
  // Check for custom domains first (exact match)
  // This will be resolved by fetchTenantByCustomDomain
  
  // Production subdomain pattern: tenant.mediloop.com
  const parts = hostname.split('.');
  
  // Check if this is a subdomain
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  // If no subdomain pattern, might be a custom domain
  // Return the full hostname for custom domain lookup
  return hostname;
};

/**
 * Fetch tenant info by custom domain
 */
export const fetchTenantByCustomDomain = async (customDomain: string): Promise<Tenant | null> => {
  try {
    console.log('Fetching tenant by custom domain:', customDomain);
    
    // For now, return null until API endpoints are implemented
    console.warn('fetchTenantByCustomDomain: API endpoint not implemented yet');
    return null;
  } catch (error) {
    console.error('Exception when fetching tenant by custom domain:', error);
    return null;
  }
};

/**
 * Fetch tenant info from database by domain (subdomain or custom domain)
 */
export const fetchTenantInfo = async (tenantDomain: string): Promise<Tenant | null> => {
  try {
    console.log('Fetching tenant info for domain:', tenantDomain);
    
    // First, try to find by custom domain
    const customDomainTenant = await fetchTenantByCustomDomain(tenantDomain);
    if (customDomainTenant) {
      return customDomainTenant;
    }
    
    // For now, return mock data until API endpoints are implemented
    console.warn('fetchTenantInfo: API endpoint not implemented yet');
    
    // Return mock tenant for development
    if (tenantDomain && tenantDomain !== 'null') {
      return {
        id: `tenant-${tenantDomain}`,
        name: `${tenantDomain} Healthcare`,
        domain: tenantDomain,
        schema: `tenant_${tenantDomain}`,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Exception when fetching tenant:', error);
    return null;
  }
};

/**
 * Fetch tenant info for the current user
 */
export const fetchUserTenant = async (userId: string): Promise<Tenant | null> => {
  try {
    console.log('Fetching tenant info for user:', userId);
    
    // For now, return mock data until API endpoints are implemented
    console.warn('fetchUserTenant: API endpoint not implemented yet');
    
    // Return mock tenant for development
    return {
      id: `user-tenant-${userId}`,
      name: `${userId} Personal Tenant`,
      domain: userId,
      schema: `tenant_${userId.replace(/-/g, '_')}`,
      isActive: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Exception when fetching user tenant:', error);
    return null;
  }
};

/**
 * Create tenant for a user during signup
 */
export const createUserTenant = async (
  userId: string,
  userRole: string,
  userName: string,
  workplaceName?: string,
  pharmacyName?: string
): Promise<string | null> => {
  try {
    console.log('Creating tenant for user:', { userId, userRole, userName, workplaceName, pharmacyName });
    
    // For now, return mock tenant ID until API endpoints are implemented
    console.warn('createUserTenant: API endpoint not implemented yet');
    return `tenant-${userId}`;
  } catch (error) {
    console.error('Exception when creating user tenant:', error);
    return null;
  }
};

/**
 * Update tenant name when workplace/pharmacy is selected
 */
export const updateUserTenantName = async (
  userId: string,
  workplaceName?: string,
  pharmacyName?: string
): Promise<boolean> => {
  try {
    console.log('Updating tenant name for user:', { userId, workplaceName, pharmacyName });
    
    // For now, return success until API endpoints are implemented
    console.warn('updateUserTenantName: API endpoint not implemented yet');
    return true;
  } catch (error) {
    console.error('Exception when updating tenant name:', error);
    return false;
  }
};

/**
 * Associate a user with a tenant
 */
export const associateUserWithTenant = async (userId: string, tenantId: string, role: string = 'user'): Promise<boolean> => {
  try {
    console.log('Associating user with tenant:', { userId, tenantId, role });
    
    // For now, return success until API endpoints are implemented
    console.warn('associateUserWithTenant: API endpoint not implemented yet');
    return true;
  } catch (error) {
    console.error('Exception when associating user with tenant:', error);
    return false;
  }
};

/**
 * Get current tenant ID from user session (this would need to be adapted based on your auth system)
 */
export const getCurrentTenantId = async (): Promise<string | null> => {
  try {
    // This would need to be adapted to your auth system
    // For now, return null as this depends on your session management
    return null;
  } catch (error) {
    console.error('Error getting current tenant ID:', error);
    return null;
  }
};

/**
 * Initiate domain verification
 */
export const initiateDomainVerification = async (tenantId: string, domain: string) => {
  try {
    console.log('Initiating domain verification for:', { tenantId, domain });
    
    const response = await fetch(
      `${MEDILOOP_API_BASE}/api/domain/initiate-verification`,
      {
        method: "POST",
        headers: buildAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ tenantId, domain }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initiate domain verification');
    }

    const result = await response.json();
    console.log('Domain verification initiated:', result);
    return result;
  } catch (error) {
    console.error('Exception when initiating domain verification:', error);
    throw error;
  }
};

export const verifyDomainOwnership = async (verificationId: string) => {
  try {
    console.log('Verifying domain ownership for:', verificationId);
    
    const response = await fetch(`${MEDILOOP_API_BASE}/api/domain/verify`, {
      method: "POST",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ verificationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify domain ownership');
    }

    const result = await response.json();
    console.log('Domain verification result:', result);
    return result;
  } catch (error) {
    console.error('Exception when verifying domain ownership:', error);
    return { success: false, message: error.message || 'Verification failed' };
  }
};

export const removeCustomDomain = async (tenantId: string) => {
  try {
    console.log('Removing custom domain for tenant:', tenantId);
    
    const response = await fetch(`${MEDILOOP_API_BASE}/api/domain/remove`, {
      method: "DELETE",
      headers: buildAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ tenantId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove custom domain');
    }

    const result = await response.json();
    console.log('Domain removal result:', result);
    return result.success;
  } catch (error) {
    console.error('Exception when removing custom domain:', error);
    return false;
  }
};

export const fetchDomainVerifications = async (tenantId?: string): Promise<DomainVerification[]> => {
  try {
    console.log('Fetching domain verifications for tenant:', tenantId);
    
    if (!tenantId) {
      return [];
    }

    const response = await fetch(
      `${MEDILOOP_API_BASE}/api/domain/verifications/${tenantId}`,
      {
        method: "GET",
        headers: buildAuthHeaders({
          "Content-Type": "application/json",
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch domain verifications');
    }

    const verifications = await response.json();
    console.log('Domain verifications:', verifications);
    return verifications;
  } catch (error) {
    console.error('Exception when fetching domain verifications:', error);
    return [];
  }
};
