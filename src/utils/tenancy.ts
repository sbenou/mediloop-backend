
import { supabase } from '@/lib/supabase';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  schema: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

/**
 * Get tenant domain from hostname
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
    
    console.log('Running in Lovable preview environment - using default tenant');
    // For preview environments, return null to use the default tenant
    return null;
  }
  
  // For development environments
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Allow testing with localhost:8080?tenant=example
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    return tenantParam;
  }
  
  // Production subdomain pattern: tenant.mediloop.com
  const parts = hostname.split('.');
  
  // Check if this is a subdomain
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  return null;
};

/**
 * Fetch tenant info from database
 */
export const fetchTenantInfo = async (tenantDomain: string): Promise<Tenant | null> => {
  try {
    console.log('Fetching tenant info for domain:', tenantDomain);
    
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
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Exception when fetching tenant:', error);
    return null;
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
