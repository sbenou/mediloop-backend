
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import PharmacyDashboard from '@/pages/PharmacyDashboard';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';

const ProtectedPharmacyDashboard = () => {
  const { isLoading, isAuthenticated } = useAuth();
  
  // Handle initial loading state when auth is being determined
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, ProtectedRoute will handle redirection
  return (
    <ProtectedRoute allowedRoles={['pharmacist', 'superadmin']}>
      <PharmacyDashboard />
    </ProtectedRoute>
  );
};

export default ProtectedPharmacyDashboard;
