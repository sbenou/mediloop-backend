
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";

interface RequireRoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

const RequireRoleGuard = ({ allowedRoles, children }: RequireRoleGuardProps) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔐 RequireRoleGuard check:", {
      isAuthenticated,
      userRole,
      allowedRoles,
    });
  }, [isAuthenticated, userRole, allowedRoles]);

  // If still loading authentication state, show a loading spinner
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  const roleAllowed =
    userRole &&
    allowedRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());

  // If not authenticated or role not allowed, redirect
  if (!isAuthenticated || !userRole || !roleAllowed) {
    console.warn("🚫 Unauthorized access. Redirecting to /unauthorized");
    navigate("/unauthorized", { replace: true });
    return null;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
};

export default RequireRoleGuard;
