import { sql } from '@/lib/database';

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
    // Allow testing with localhost:8080?tenant=example
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
    
    const result = await sql`
      SELECT * FROM tenants 
      WHERE custom_domain = ${customDomain} 
      AND is_active = true 
      AND domain_verified = true
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      console.warn('No tenant found with custom domain:', customDomain);
      return null;
    }
    
    const data = result[0];
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      schema: data.schema,
      isActive: data.is_active,
      status: data.status,
      createdAt: data.created_at,
      customDomain: data.custom_domain || null,
      domainVerified: data.domain_verified || false
    };
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
    
    // Then try to find by subdomain
    const result = await sql`
      SELECT * FROM tenants 
      WHERE domain = ${tenantDomain} 
      AND is_active = true
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      console.warn('No tenant found with domain:', tenantDomain);
      return null;
    }
    
    const data = result[0];
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      schema: data.schema,
      isActive: data.is_active,
      status: data.status,
      createdAt: data.created_at,
      customDomain: data.custom_domain || null,
      domainVerified: data.domain_verified || false
    };
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
    
    const result = await sql`
      SELECT * FROM tenants 
      WHERE domain = ${userId} 
      AND is_active = true
      LIMIT 1
    `;
    
    if (!result || result.length === 0) {
      console.warn('No tenant found for user:', userId);
      return null;
    }
    
    const data = result[0];
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      schema: data.schema,
      isActive: data.is_active,
      status: data.status,
      createdAt: data.created_at
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
    
    const result = await sql`
      SELECT create_user_tenant(
        ${userId}::uuid,
        ${userRole},
        ${userName},
        ${workplaceName || null},
        ${pharmacyName || null}
      ) as tenant_id
    `;
    
    if (!result || result.length === 0) {
      console.error('Error creating user tenant: No result returned');
      return null;
    }
    
    console.log('Tenant created successfully:', result[0].tenant_id);
    return result[0].tenant_id;
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
    
    const result = await sql`
      SELECT update_user_tenant_name(
        ${userId}::uuid,
        ${workplaceName || null},
        ${pharmacyName || null}
      ) as success
    `;
    
    if (!result || result.length === 0) {
      console.error('Error updating tenant name: No result returned');
      return false;
    }
    
    console.log('Tenant name updated successfully:', result[0].success);
    return result[0].success;
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
    // Update the user's profile with the tenant ID
    const profileResult = await sql`
      UPDATE profiles 
      SET tenant_id = ${tenantId}::uuid 
      WHERE id = ${userId}::uuid
    `;
    
    // Also add the user to tenant_users using the stored function
    const tenantResult = await sql`
      SELECT add_user_to_tenant(
        ${userId}::uuid, 
        ${tenantId}::uuid,
        ${role}
      ) as success
    `;

    return tenantResult[0]?.success || false;
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
 * Domain verification functions - Mock implementations since the backend functions don't exist yet
 */
export const initiateDomainVerification = async (tenantId: string, domain: string) => {
  try {
    console.log('Initiating domain verification for:', { tenantId, domain });
    
    // Mock implementation - return a verification token
    const mockResult = {
      verification_id: `ver_${Date.now()}`,
      txt_record: `mediloop-verification=${Math.random().toString(36).substring(2, 15)}`,
      domain: domain,
      tenant_id: tenantId
    };
    
    console.log('Mock domain verification initiated:', mockResult);
    return mockResult;
  } catch (error) {
    console.error('Exception when initiating domain verification:', error);
    return null;
  }
};

export const verifyDomainOwnership = async (verificationId: string) => {
  try {
    console.log('Verifying domain ownership for:', verificationId);
    
    // Mock implementation - simulate verification
    const mockResult = {
      success: Math.random() > 0.3, // 70% success rate for demo
      domain: 'example.com',
      message: Math.random() > 0.3 ? 'Domain verified successfully' : 'DNS record not found. Please check your configuration.'
    };
    
    console.log('Mock domain verification result:', mockResult);
    return mockResult;
  } catch (error) {
    console.error('Exception when verifying domain ownership:', error);
    return { success: false, message: 'Verification failed' };
  }
};

export const removeCustomDomain = async (tenantId: string) => {
  try {
    console.log('Removing custom domain for tenant:', tenantId);
    
    // Mock implementation - simulate removal
    const success = Math.random() > 0.1; // 90% success rate for demo
    
    console.log('Mock domain removal result:', success);
    return success;
  } catch (error) {
    console.error('Exception when removing custom domain:', error);
    return false;
  }
};

export const fetchDomainVerifications = async (tenantId?: string): Promise<DomainVerification[]> => {
  try {
    console.log('Fetching domain verifications for tenant:', tenantId);
    
    // Mock implementation - return empty array since the table doesn't exist
    const mockVerifications: DomainVerification[] = [];
    
    console.log('Mock domain verifications:', mockVerifications);
    return mockVerifications;
  } catch (error) {
    console.error('Exception when fetching domain verifications:', error);
    return [];
  }
};
