
import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const TenantDisplay = () => {
  const { currentTenant, isLoading, error } = useTenant();
  
  if (isLoading) {
    return <Skeleton className="h-4 w-32" />;
  }
  
  if (error) {
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
  
  if (!currentTenant) {
    return (
      <Badge variant="outline" className="text-sm">
        Default Instance
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="text-sm">
      {currentTenant.name} ({currentTenant.domain})
    </Badge>
  );
};

export default TenantDisplay;
