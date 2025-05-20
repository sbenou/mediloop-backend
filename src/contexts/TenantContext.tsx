
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Tenant, getTenantFromHostname, fetchTenantInfo } from '@/utils/tenancy';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface TenantContextType {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  switchTenant: (domain: string) => Promise<boolean>;
}

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  isLoading: true,
  error: null,
  switchTenant: async () => false,
});

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  const initTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get tenant from hostname
      const tenantDomain = getTenantFromHostname(window.location.hostname);
      
      if (!tenantDomain) {
        console.log('No tenant domain found in URL - using default tenant');
        setIsLoading(false);
        return;
      }
      
      console.log('Detected tenant domain:', tenantDomain);
      
      // Fetch tenant information
      const tenant = await fetchTenantInfo(tenantDomain);
      
      if (!tenant) {
        console.warn(`Tenant "${tenantDomain}" not found or inactive`);
        // Don't set an error here, just leave currentTenant as null
        setIsLoading(false);
        return;
      }
      
      console.log('Setting current tenant:', tenant);
      setCurrentTenant(tenant);
      
      // If user is authenticated, set tenant in JWT claims
      if (isAuthenticated && user?.id) {
        await setTenantInSession(tenant.id, tenant.schema);
      }
      
    } catch (err) {
      console.error('Error initializing tenant:', err);
      // Don't set error state, just log the error and continue
      console.warn('Continuing without tenant context');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize tenant when component mounts
  useEffect(() => {
    initTenant();
  }, []);
  
  // When auth state changes, update tenant in session
  useEffect(() => {
    if (isAuthenticated && user?.id && currentTenant) {
      setTenantInSession(currentTenant.id, currentTenant.schema).then(success => {
        if (!success) {
          toast({
            title: "Tenant Context",
            description: "Failed to set tenant context. Some features may be limited.",
            variant: "destructive",
          });
        }
      });
    }
  }, [isAuthenticated, user?.id, currentTenant]);
  
  // Helper function to set both tenant id and schema in JWT claims
  const setTenantInSession = async (tenantId: string, tenantSchema: string): Promise<boolean> => {
    try {
      // Set tenant_id claim
      const { error: idError } = await supabase.rpc('set_claim', { 
        name: 'tenant_id', 
        value: tenantId 
      });
      
      if (idError) {
        console.error('Error setting tenant_id claim:', idError);
        return false;
      }
      
      // Set tenant schema claim (for backward compatibility)
      const { error: schemaError } = await supabase.rpc('set_claim', { 
        name: 'tenant', 
        value: tenantSchema
      });
      
      if (schemaError) {
        console.error('Error setting tenant schema claim:', schemaError);
        return false;
      }

      // Force refresh the session to include the new claims
      await supabase.auth.refreshSession();
      
      // Also update the profile record with the tenant ID
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ tenant_id: tenantId })
          .eq('id', user.id);
      }
      
      return true;
    } catch (error) {
      console.error('Exception when setting tenant in session:', error);
      return false;
    }
  };
  
  const switchTenant = async (domain: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Fetch new tenant information
      const tenant = await fetchTenantInfo(domain);
      
      if (!tenant) {
        setError(new Error(`Tenant "${domain}" not found or inactive`));
        return false;
      }
      
      // Set new tenant
      setCurrentTenant(tenant);
      
      // If user is authenticated, update JWT claims
      if (isAuthenticated && user?.id) {
        await setTenantInSession(tenant.id, tenant.schema);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error switching tenant'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        isLoading,
        error,
        switchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

export default TenantContext;
