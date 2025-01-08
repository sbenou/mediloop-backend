import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductUploader } from "@/components/product/ProductUploader";
import { LayoutDashboard, Users, Shield, Box } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { RoleManagementTable } from "@/components/admin/RoleManagementTable";
import { UserProfile } from "@/types/user";
import { AddPermissionForm } from "@/components/admin/AddPermissionForm";
import { availableRoutePermissions } from "@/components/admin/types";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const { toast } = useToast();

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: userProfile?.role === 'superadmin',
  });

  const updateUserRole = async (userId: string, newRole: UserProfile['role']) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) throw error;
  };

  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    navigate(`/admin-settings?tab=${value}`);
  };

  const handleCardClick = (tab: string) => {
    handleTabChange(tab);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="products">
            <Box className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardCards onCardClick={handleCardClick} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagementTable 
            users={users}
            isLoading={isLoading}
            updateUserRole={updateUserRole}
          />
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagementTable />
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Permissions Management</CardTitle>
              <AddPermissionForm />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {availableRoutePermissions.map((routePermission) => (
                  <div key={routePermission.route} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">{routePermission.route}</h3>
                    <div className="space-y-2">
                      {routePermission.permissions.map((permission) => (
                        <div key={permission.id} className="bg-accent/30 p-3 rounded-md">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-sm text-muted-foreground">{permission.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">ID: {permission.id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductUploader />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
};

export default AdminSettings;
