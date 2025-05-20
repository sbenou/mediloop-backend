
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Hook to use Supabase with the current tenant's schema
 */
export function useTenantSupabase() {
  const { currentTenant } = useTenant();
  
  /**
   * Get a reference to a table in the current tenant's schema
   */
  const tenantTable = useCallback(<T>(tableName: string): PostgrestFilterBuilder<any, any, T[], unknown> => {
    if (!currentTenant) {
      console.warn('Attempting to access tenant table without an active tenant');
      // Return a query that will likely return no results (empty tenant name)
      return supabase.from(tableName);
    }
    
    // Use the tenant's schema for the table
    return supabase.from(`${currentTenant.schema}.${tableName}`);
  }, [currentTenant]);
  
  /**
   * Execute an RPC in the context of the current tenant
   */
  const tenantRpc = useCallback(async (functionName: string, params?: object) => {
    if (!currentTenant) {
      console.warn('Attempting to call tenant RPC without an active tenant');
      return { data: null, error: new Error('No active tenant') };
    }
    
    return supabase.rpc(functionName, {
      ...(params || {}),
      _tenant_schema: currentTenant.schema
    });
  }, [currentTenant]);
  
  return {
    tenantTable,
    tenantRpc,
    currentTenant
  };
}
