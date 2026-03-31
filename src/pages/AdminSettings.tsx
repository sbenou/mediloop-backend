
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const legacySupabaseAdminTabs =
  import.meta.env.VITE_SUPABASE_ADMIN_TABS === "true";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { profile, isLoading: authLoading } = useAuth();
  
  const { users, isLoading: adminDataLoading, updateUserRole } = useAdminData(profile);

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

  console.log('Admin Settings - Current users:', users);
  console.log('Admin Settings - Loading state:', adminDataLoading);
  console.log('Admin Settings - Current profile:', profile);

  const handleBackNavigation = () => {
    // Redirect back to superadmin dashboard if user is superadmin
    if (profile.role === 'superadmin') {
      navigate('/superadmin/dashboard');
    } else {
      navigate('/');
    }
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
              <BreadcrumbLink onClick={() => navigate('/')}>
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/profile')}>
                Profile
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
        {adminDataLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <AdminTabs
            tabBasePath="/admin-settings"
            legacySupabaseAdminTabs={legacySupabaseAdminTabs}
            users={users}
            isLoading={adminDataLoading}
            updateUserRole={updateUserRole}
          />
        )}
        <Toaster />
      </div>
    </div>
  );
};

export default AdminSettings;
