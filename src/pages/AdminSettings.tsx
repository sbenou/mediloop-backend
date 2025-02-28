
import { Toaster } from "@/components/ui/toaster";
import { AdminTabs } from "@/components/admin/tabs/AdminTabs";
import { useAdminData } from "@/hooks/admin/useAdminData";
import Header from "@/components/layout/Header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { UserCog, Users, ShieldCheck, Package } from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";
  const { profile, isLoading: authLoading } = useAuth();
  
  const { users, isLoading: adminDataLoading, updateUserRole } = useAdminData(profile);
  
  // Filter customers (pharmacists and doctors)
  const customers = users?.filter(user => user.role === 'pharmacist' || user.role === 'doctor') || [];

  // Handle back navigation from admin settings
  const handleBackNavigation = () => {
    if (profile?.role === 'superadmin') {
      navigate('/superadmin-dashboard');
    } else {
      navigate('/');
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
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
              <BreadcrumbLink onClick={() => navigate('/')}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/superadmin-dashboard')}>
                Admin Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Admin Settings</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'users' ? 'border-primary' : 'border'}`}
            onClick={() => navigate("/admin-settings?tab=users")}
          >
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-medium">Users</h3>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'roles' ? 'border-primary' : 'border'}`}
            onClick={() => navigate("/admin-settings?tab=roles")}
          >
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
              <ShieldCheck className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-medium">Roles</h3>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'customers' ? 'border-primary' : 'border'}`}
            onClick={() => navigate("/admin-settings?tab=customers")}
          >
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
              <UserCog className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-medium">Customers</h3>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeTab === 'products' ? 'border-primary' : 'border'}`}
            onClick={() => navigate("/admin-settings?tab=products")}
          >
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
              <Package className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-medium">Products</h3>
            </CardContent>
          </Card>
        </div>
        
        {adminDataLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <AdminTabs 
            users={users}
            customers={customers}
            isLoading={adminDataLoading}
            updateUserRole={updateUserRole}
            activeTab={activeTab}
          />
        )}
        <Toaster />
      </div>
    </div>
  );
};

export default AdminSettings;
