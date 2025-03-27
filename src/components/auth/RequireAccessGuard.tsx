
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";

interface RequireAccessGuardProps {
  /**
   * The role that is required for basic access
   */
  requiredRole: string;
  
  /**
   * Additional permissions required for this specific view/component
   */
  requiredPermission: string;
  
  /**
   * React children to render if access is granted
   */
  children: ReactNode;
  
  /**
   * Optional fallback component to render if permission check fails 
   * but user has the basic role access
   */
  fallback?: ReactNode;
}

/**
 * A guard component for fine-grained access control within role-based pages
 * Allows restricting specific features/views to users with particular permissions
 * within a broader role, such as doctor_staff vs doctor_admin
 */
const RequireAccessGuard = ({ 
  requiredRole, 
  requiredPermission, 
  children, 
  fallback 
}: RequireAccessGuardProps) => {
  const { isAuthenticated, isLoading, userRole, hasPermission } = useAuth();
  const navigate = useNavigate();

  // If still loading authentication state, show a loading spinner
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // First, check if user has the required role
  const hasRequiredRole = userRole === requiredRole;
  
  // If not authenticated or missing the required role, redirect
  if (!isAuthenticated || !hasRequiredRole) {
    navigate("/unauthorized", { replace: true });
    return null;
  }
  
  // Now check for the specific permission
  const hasAccess = hasPermission(requiredPermission);
  
  // If they have the role but not the specific permission,
  // show the fallback component if provided, otherwise redirect
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    navigate("/unauthorized", { replace: true });
    return null;
  }

  // User has both role and permission - render the main content
  return <>{children}</>;
};

export default RequireAccessGuard;
