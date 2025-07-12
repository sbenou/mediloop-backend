import { supabase } from '@/lib/supabase';

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
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('custom_domain', customDomain)
      .eq('is_active', true)
      .eq('domain_verified', true)
      .single();
    
    if (error) {
      console.error('Error fetching tenant by custom domain:', error);
      return null;
    }
    
    if (!data) {
      console.warn('No tenant found with custom domain:', customDomain);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      schema: data.schema,
      isActive: data.is_active,
      status: data.status,
      createdAt: data.created_at,
      customDomain: data.custom_domain,
      domainVerified: data.domain_verified
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
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', tenantDomain)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching tenant info:', error);
      return null;
    }
    
    if (!data) {
      console.warn('No tenant found with domain:', tenantDomain);
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      schema: data.schema,
      isActive: data.is_active,
      status: data.status,
      createdAt: data.created_at,
      customDomain: data.custom_domain,
      domainVerified: data.domain_verified
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
    
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', userId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching user tenant info:', error);
      return null;
    }
    
    if (!data) {
      console.warn('No tenant found for user:', userId);
      return null;
    }
    
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
    
    const { data, error } = await supabase.rpc('create_user_tenant', {
      p_user_id: userId,
      p_user_role: userRole,
      p_user_name: userName,
      p_workplace_name: workplaceName || null,
      p_pharmacy_name: pharmacyName || null
    });
    
    if (error) {
      console.error('Error creating user tenant:', error);
      return null;
    }
    
    console.log('Tenant created successfully:', data);
    return data;
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
    
    const { data, error } = await supabase.rpc('update_user_tenant_name', {
      p_user_id: userId,
      p_workplace_name: workplaceName || null,
      p_pharmacy_name: pharmacyName || null
    });
    
    if (error) {
      console.error('Error updating tenant name:', error);
      return false;
    }
    
    console.log('Tenant name updated successfully:', data);
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
    // Update the user's profile with the tenant ID
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tenant_id: tenantId })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error updating profile with tenant ID:', profileError);
      return false;
    }
    
    // Also add the user to tenant_users in the tenant schema (if tenant-specific schema is used)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('schema')
      .eq('id', tenantId)
      .single();
    
    if (tenant?.schema) {
      // Add user to tenant_users table in tenant schema
      await supabase.rpc('add_user_to_tenant', { 
        p_user_id: userId, 
        p_tenant_id: tenantId,
        p_role: role
      });
    }

    return true;
  } catch (error) {
    console.error('Exception when associating user with tenant:', error);
    return false;
  }
};

/**
 * Get current tenant ID from Supabase session
 */
export const getCurrentTenantId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user.app_metadata?.tenant_id || null;
  } catch (error) {
    console.error('Error getting current tenant ID:', error);
    return null;
  }
};

/**
 * Domain verification functions
 */
export const initiateDomainVerification = async (tenantId: string, domain: string) => {
  try {
    console.log('Initiating domain verification for:', { tenantId, domain });
    
    const { data, error } = await supabase.rpc('initiate_domain_verification', {
      p_tenant_id: tenantId,
      p_domain: domain
    });
    
    if (error) {
      console.error('Error initiating domain verification:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when initiating domain verification:', error);
    return null;
  }
};

export const verifyDomainOwnership = async (verificationId: string) => {
  try {
    console.log('Verifying domain ownership for:', verificationId);
    
    const { data, error } = await supabase.rpc('verify_domain_ownership', {
      p_verification_id: verificationId
    });
    
    if (error) {
      console.error('Error verifying domain ownership:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when verifying domain ownership:', error);
    return null;
  }
};

export const removeCustomDomain = async (tenantId: string) => {
  try {
    console.log('Removing custom domain for tenant:', tenantId);
    
    const { data, error } = await supabase.rpc('remove_custom_domain', {
      p_tenant_id: tenantId
    });
    
    if (error) {
      console.error('Error removing custom domain:', error);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error('Exception when removing custom domain:', error);
    return false;
  }
};

export const fetchDomainVerifications = async (tenantId?: string): Promise<DomainVerification[]> => {
  try {
    let query = supabase
      .from('domain_verifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching domain verifications:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      tenantId: item.tenant_id,
      domain: item.domain,
      verificationToken: item.verification_token,
      verificationMethod: item.verification_method,
      status: item.status,
      attempts: item.attempts,
      lastAttemptAt: item.last_attempt_at,
      verifiedAt: item.verified_at,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('Exception when fetching domain verifications:', error);
    return [];
  }
};
