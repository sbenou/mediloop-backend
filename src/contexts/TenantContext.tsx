
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Tenant, getTenantFromHostname, fetchTenantInfo, setTenantInSession } from '@/utils/tenancy';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';

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
        console.log('No tenant domain found in URL');
        setIsLoading(false);
        return;
      }
      
      console.log('Detected tenant domain:', tenantDomain);
      
      // Fetch tenant information
      const tenant = await fetchTenantInfo(tenantDomain);
      
      if (!tenant) {
        setError(new Error(`Tenant "${tenantDomain}" not found or inactive`));
        setIsLoading(false);
        return;
      }
      
      console.log('Setting current tenant:', tenant);
      setCurrentTenant(tenant);
      
      // If user is authenticated, set tenant in JWT claims
      if (isAuthenticated && user?.id) {
        await setTenantInSession(tenant.schema);
      }
      
    } catch (err) {
      console.error('Error initializing tenant:', err);
      setError(err instanceof Error ? err : new Error('Unknown error initializing tenant'));
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
      setTenantInSession(currentTenant.schema).then(success => {
        if (!success) {
          toast({
            title: "Tenant Error",
            description: "Failed to set tenant context. Some features may be limited.",
            variant: "destructive",
          });
        }
      });
    }
  }, [isAuthenticated, user?.id, currentTenant]);
  
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
        await setTenantInSession(tenant.schema);
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
