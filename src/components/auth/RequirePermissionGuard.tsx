
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";

interface RequirePermissionGuardProps {
  requiredPermissions: string[];
  children: ReactNode;
}

const RequirePermissionGuard = ({ requiredPermissions, children }: RequirePermissionGuardProps) => {
  const { isAuthenticated, isLoading, permissions } = useAuth();
  const navigate = useNavigate();

  // If still loading authentication state, show a loading spinner
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

  // Check if the user has all the required permissions
  const hasAllPermissions = requiredPermissions.every(
    permission => permissions.includes(permission)
  );

  // If not authenticated or missing required permissions, redirect
  if (!isAuthenticated || !hasAllPermissions) {
    navigate("/unauthorized", { replace: true });
    return null;
  }

  // User is authenticated and has all required permissions, render children
  return <>{children}</>;
};

export default RequirePermissionGuard;
