
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Hook to use Supabase with the current tenant's schema
 */
export function useTenantSupabase() {
  const { currentTenant, isPreviewMode } = useTenant();
  
  /**
   * Get a reference to a table in the current tenant's schema
   */
  const tenantTable = useCallback(<T>(tableName: string) => {
    if (!currentTenant) {
      if (isPreviewMode) {
        console.log(`Preview mode: Using default schema for table ${tableName}`);
      } else {
        console.warn(`No active tenant: Using default schema for table ${tableName}`);
      }
      // Return a query that will use the public schema
      return supabase.from(tableName);
    }
    
    // Use the tenant's schema for the table
    return supabase.from(`${currentTenant.schema}.${tableName}`);
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
    
    return supabase.rpc(functionName, {
      ...(params || {}),
      _tenant_schema: currentTenant.schema,
      _tenant_id: currentTenant.id
    });
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
      // Update tenant_id claim in JWT
      const { error } = await supabase.rpc('set_claim', { 
        name: 'tenant_id', 
        value: currentTenant.id 
      });
      
      if (error) {
        console.error('Error setting tenant_id claim:', error);
        return false;
      }
      
      // Also update the schema claim for backward compatibility
      await supabase.rpc('set_claim', { 
        name: 'tenant', 
        value: currentTenant.schema 
      });
      
      // Force refresh the session to include the new claims
      await supabase.auth.refreshSession();
      
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
