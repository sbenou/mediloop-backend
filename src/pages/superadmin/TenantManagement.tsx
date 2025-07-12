
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantManagement as TenantManagementComponent } from "@/components/admin/TenantManagement";
import Header from "@/components/layout/Header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const TenantManagement = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Header showUserMenu={false} showBackLink={true} />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Check if user is superadmin
  if (!profile || profile.role !== 'superadmin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Header showUserMenu={false} showBackLink={true} />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  const handleBackNavigation = () => {
    navigate('/superadmin/dashboard');
  };

  return (
    <div>
      <Header 
        showUserMenu={false} 
        showBackLink={true} 
        onBackClick={handleBackNavigation}
      />
      <div className="container mx-auto py-4 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/superadmin/dashboard')}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Tenant Management</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Tenant Management</h1>
        <TenantManagementComponent />
      </div>
    </div>
  );
};

export default TenantManagement;
