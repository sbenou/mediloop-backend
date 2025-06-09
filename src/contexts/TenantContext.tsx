
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Tenant, getTenantFromHostname, fetchTenantInfo, fetchUserTenant } from '@/utils/tenancy';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface TenantContextType {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  isPreviewMode: boolean;
  switchTenant: (domain: string) => Promise<boolean>;
}

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  isLoading: true,
  error: null,
  isPreviewMode: false,
  switchTenant: async () => false,
});

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const { user, isAuthenticated } = useAuth();
  
  const initTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we're in a preview environment
      const isPreview = window.location.hostname.includes('lovable.app');
      setIsPreviewMode(isPreview);
      
      // In preview mode, skip tenant fetching to avoid unnecessary errors
      if (isPreview) {
        // console.log('Preview mode detected - skipping tenant initialization');
        setIsLoading(false);
        return;
      }
      
      // Get tenant from hostname first
      const tenantDomain = getTenantFromHostname(window.location.hostname);
      
      if (tenantDomain) {
        console.log('Detected tenant domain from hostname:', tenantDomain);
        
        // Fetch tenant information by domain
        const tenant = await fetchTenantInfo(tenantDomain);
        
        if (tenant) {
          console.log('Setting current tenant from domain:', tenant);
          setCurrentTenant(tenant);
          
          // If user is authenticated, set tenant in JWT claims
          if (isAuthenticated && user?.id) {
            await setTenantInSession(tenant.id, tenant.schema);
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      // If no domain-based tenant found and user is authenticated, try user-based tenant
      if (isAuthenticated && user?.id) {
        console.log('Looking for user-specific tenant for user:', user.id);
        
        const userTenant = await fetchUserTenant(user.id);
        
        if (userTenant) {
          console.log('Setting current tenant from user:', userTenant);
          setCurrentTenant(userTenant);
          await setTenantInSession(userTenant.id, userTenant.schema);
        } else {
          console.log('No tenant found for user, continuing without tenant context');
        }
      } else {
        console.log('No authenticated user, continuing without tenant context');
      }
      
    } catch (err) {
      console.error('Error initializing tenant:', err);
      // Don't set error state, just log the error and continue
      console.warn('Continuing without tenant context');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize tenant when component mounts or auth state changes
  useEffect(() => {
    initTenant();
  }, [isAuthenticated, user?.id]);
  
  // Helper function to set both tenant id and schema in JWT claims
  const setTenantInSession = async (tenantId: string, tenantSchema: string): Promise<boolean> => {
    try {
      // For now, just update the profile with tenant_id since set_claim doesn't exist
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
        isPreviewMode,
        switchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

export default TenantContext;
