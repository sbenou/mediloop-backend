
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
  // For development environments
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Allow testing with localhost:3000?tenant=example
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
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('domain', tenantDomain)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      console.error('Error fetching tenant info:', error);
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
 * Set tenant in Supabase JWT claims (for server operations)
 */
export const setTenantInSession = async (tenantSchema: string): Promise<boolean> => {
  try {
    // Update the user's JWT claims to include the tenant schema
    // This will be used by the database RLS policies
    const { error } = await supabase.rpc('set_claim', { 
      name: 'tenant', 
      value: tenantSchema 
    });
    
    if (error) {
      console.error('Error setting tenant claim:', error);
      return false;
    }

    // Force refresh the session to include the new claim
    await supabase.auth.refreshSession();
    
    return true;
  } catch (error) {
    console.error('Exception when setting tenant in session:', error);
    return false;
  }
};
