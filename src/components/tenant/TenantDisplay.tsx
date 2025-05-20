
import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

export const TenantDisplay = () => {
  const { currentTenant, isLoading, error, isPreviewMode } = useTenant();
  
  if (isLoading) {
    return <Skeleton className="h-4 w-32" />;
  }
  
  // Only show error in development mode
  if (error && process.env.NODE_ENV === 'development') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Tenant Error</AlertTitle>
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
    );
  }
  
  // If no current tenant is found
  if (!currentTenant) {
    // Only show preview mode badge in Lovable preview environments
    if (isPreviewMode) {
      return (
        <Badge variant="outline" className="text-sm bg-gray-100">
          <Info className="h-3 w-3 mr-1" /> Preview Mode
        </Badge>
      );
    }
    
    // Return nothing for regular environments with no tenant
    return null;
  }
  
  // If we have a tenant, show the tenant info
  return (
    <Badge variant="outline" className="text-sm">
      {currentTenant.name} ({currentTenant.domain})
    </Badge>
  );
};

export default TenantDisplay;
