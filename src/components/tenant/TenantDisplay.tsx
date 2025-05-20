
import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
  
  // If no current tenant is found or we're in preview mode
  if (!currentTenant || isPreviewMode) {
    // Return nothing
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
