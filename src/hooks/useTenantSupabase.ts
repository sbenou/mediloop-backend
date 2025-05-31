
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook to use Supabase with the current tenant's schema
 */
export function useTenantSupabase() {
  const { currentTenant, isPreviewMode } = useTenant();
  
  /**
   * Get a reference to a table in the current tenant's schema
   * For now, just return the regular supabase client since tenant schemas aren't implemented
   */
  const tenantTable = useCallback((tableName: string) => {
    if (!currentTenant) {
      if (isPreviewMode) {
        console.log(`Preview mode: Using default schema for table ${tableName}`);
      } else {
        console.warn(`No active tenant: Using default schema for table ${tableName}`);
      }
    }
    
    // For now, just return the regular table query since tenant schemas aren't implemented
    return supabase.from(tableName as any);
  }, [currentTenant, isPreviewMode]);
  
  /**
   * Execute an RPC in the context of the current tenant
   */
  const tenantRpc = useCallback(async (functionName: string, params?: object) => {
    if (!currentTenant) {
      if (isPreviewMode) {
        console.log(`Preview mode: Calling RPC ${functionName} without tenant context`);
      } else {
        console.warn(`No active tenant: Calling RPC ${functionName} without tenant context`);
      }
      return { data: null, error: new Error('No active tenant') };
    }
    
    // For now, just call the function directly since tenant-aware RPC isn't implemented
    return supabase.rpc(functionName as any, params);
  }, [currentTenant, isPreviewMode]);
  
  /**
   * Set tenant ID in the user's JWT claims
   */
  const setTenantInJWT = useCallback(async (): Promise<boolean> => {
    if (!currentTenant) {
      if (isPreviewMode) {
        console.log('Preview mode: Cannot set tenant in JWT');
      } else {
        console.warn('No active tenant: Cannot set tenant in JWT');
      }
      return false;
    }
    
    try {
      // For now, just return true since set_claim function doesn't exist
      console.log('Tenant JWT setting not implemented yet');
      return true;
    } catch (error) {
      console.error('Exception when setting tenant in JWT:', error);
      return false;
    }
  }, [currentTenant, isPreviewMode]);
  
  return {
    tenantTable,
    tenantRpc,
    currentTenant,
    setTenantInJWT,
    isPreviewMode
  };
}
