
import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

export const TenantDisplay = () => {
  const { currentTenant, isLoading, error } = useTenant();
  
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
  
  // Check if we're in a Lovable preview environment
  const isPreviewEnvironment = window.location.hostname.includes('lovable.app');
  
  if (!currentTenant) {
    if (isPreviewEnvironment) {
      return (
        <Badge variant="outline" className="text-sm bg-gray-100">
          <Info className="h-3 w-3 mr-1" /> Preview Mode
        </Badge>
      );
    }
    
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
