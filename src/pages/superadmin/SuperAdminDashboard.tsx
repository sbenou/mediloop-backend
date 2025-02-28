
import React from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Users, Database, ShieldCheck, Package } from "lucide-react";

interface DashboardStats {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  total_products: number;
}

const SuperAdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      if (error) throw error;
      return data as DashboardStats[];
    },
  });

  // Extract the first item from the stats array or use default values
  const stats: DashboardStats = statsData && statsData.length > 0 
    ? statsData[0] 
    : { total_users: 0, total_roles: 0, total_permissions: 0, total_products: 0 };

  const handleTabChange = (value: string) => {
    navigate(`/superadmin-dashboard?tab=${value}`);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name || "Administrator"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                ) : (
                  stats.total_users || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Active accounts in the platform
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                ) : (
                  stats.total_roles || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Role configurations
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                ) : (
                  stats.total_permissions || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                System permissions
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                ) : (
                  stats.total_products || 0
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Active product listings
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed" onClick={() => navigate("/admin-settings?tab=users")}>
                  <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                    <Users className="h-10 w-10 mb-2 text-primary" />
                    <h3 className="font-medium">Manage Users</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Add, edit, or remove users
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed" onClick={() => navigate("/admin-settings?tab=roles")}>
                  <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                    <ShieldCheck className="h-10 w-10 mb-2 text-primary" />
                    <h3 className="font-medium">Manage Roles</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Configure roles and permissions
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed" onClick={() => navigate("/admin-settings?tab=products")}>
                  <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                    <Package className="h-10 w-10 mb-2 text-primary" />
                    <h3 className="font-medium">Manage Products</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      Add or modify product listings
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder content for other tabs - actual implementation will be in admin-settings */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>User management has been moved to the Admin Settings page.</p>
                <div className="mt-4">
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md"
                    onClick={() => navigate("/admin-settings?tab=users")}
                  >
                    Go to User Management
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Roles Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Role management has been moved to the Admin Settings page.</p>
                <div className="mt-4">
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md"
                    onClick={() => navigate("/admin-settings?tab=roles")}
                  >
                    Go to Role Management
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permissions Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Permission management has been moved to the Admin Settings page.</p>
                <div className="mt-4">
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md"
                    onClick={() => navigate("/admin-settings?tab=permissions")}
                  >
                    Go to Permission Management
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Products Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Product management has been moved to the Admin Settings page.</p>
                <div className="mt-4">
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md"
                    onClick={() => navigate("/admin-settings?tab=products")}
                  >
                    Go to Product Management
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
