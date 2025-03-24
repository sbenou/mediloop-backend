
import { useAuth } from "@/hooks/auth/useAuth";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { Loader } from "lucide-react";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

interface ProtectedRouteProps {
  allowedRoles: string[]; // e.g. ["doctor", "pharmacist"]
  children: ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, profile } = useAuth();

  // Show loading state while we're determining authentication
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to appropriate dashboard if not authorized for this route
  if (!profile || !allowedRoles.includes(profile.role)) {
    const fallback = getDashboardRouteByRole(profile?.role);
    console.log(`User with role ${profile?.role} not authorized. Redirecting to ${fallback}`);
    return <Navigate to={fallback} replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
