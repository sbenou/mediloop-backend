
import React, { useEffect } from "react";
import SuperAdminSidebar from "@/components/sidebar/SuperAdminSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, profile, userRole } = useAuth();
  const navigate = useNavigate();

  // Add logging for debugging
  useEffect(() => {
    console.log("SuperAdminLayout - Auth state:", { 
      isAuthenticated, 
      isLoading, 
      role: profile?.role,
      userRole
    });
  }, [isAuthenticated, isLoading, profile, userRole]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    console.log("SuperAdminLayout - Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Redirect if not a superadmin
  if (profile?.role !== "superadmin") {
    console.log("SuperAdminLayout - Not superadmin, redirecting to dashboard", {
      role: profile?.role
    });
    toast({
      title: "Access Denied",
      description: "You don't have permission to access the admin dashboard.",
      variant: "destructive"
    });
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
};

export default SuperAdminLayout;
