
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, UserCheck, Lock, Box, Stethoscope } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardCards } from "../DashboardCards";
import { UserManagementTable } from "../UserManagementTable";
import { RoleManagementTable } from "../RoleManagementTable";
import { PermissionsManagementCard } from "./PermissionsManagementCard";
import { ProductManagementCard } from "./ProductManagementCard";
import { CustomersCard } from "./CustomersCard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function NeonAdminTabPlaceholder({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          This area previously depended on Supabase (roles, permissions, products). It is not wired to the Neon API yet. Set{" "}
          <span className="font-mono text-xs">VITE_SUPABASE_ADMIN_TABS=true</span> only if you still run those tables through Supabase.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export const AdminTabs = ({
  users,
  isLoading,
  updateUserRole,
  tabBasePath = "/admin-settings",
  legacySupabaseAdminTabs = false,
}: {
  users?: any[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  /** Route used when changing tabs (must match the page that hosts this component). */
  tabBasePath?: string;
  /** When true, load legacy Supabase-backed role/product/customer admin. Default false (Neon). */
  legacySupabaseAdminTabs?: boolean;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const getIconColor = (tabName: string) => {
    if (activeTab !== tabName) return "currentColor";
    
    switch (tabName) {
      case 'users':
        return "#2A7A9B"; // Teal
      case 'roles':
        return "#176D4A"; // Green
      case 'permissions':
        return "#BF7F21"; // Orange/Brown
      case 'products':
        return "#6C3894"; // Purple
      case 'customers':
        return "#0E766E"; // Teal
      default:
        return "currentColor";
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`${tabBasePath}?tab=${value}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <div className="px-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" style={{ color: getIconColor('users') }} />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <UserCheck className="h-4 w-4 mr-2" style={{ color: getIconColor('roles') }} />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Lock className="h-4 w-4 mr-2" style={{ color: getIconColor('permissions') }} />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="products">
            <Box className="h-4 w-4 mr-2" style={{ color: getIconColor('products') }} />
            Products
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Stethoscope className="h-4 w-4 mr-2" style={{ color: getIconColor('customers') }} />
            Customers
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="dashboard">
        <DashboardCards onCardClick={handleTabChange} />
      </TabsContent>

      <TabsContent value="users">
        <UserManagementTable 
          users={users}
          isLoading={isLoading}
          updateUserRole={updateUserRole}
        />
      </TabsContent>

      <TabsContent value="roles">
        {legacySupabaseAdminTabs ? (
          <RoleManagementTable />
        ) : (
          <NeonAdminTabPlaceholder title="Roles" />
        )}
      </TabsContent>

      <TabsContent value="permissions">
        {legacySupabaseAdminTabs ? (
          <PermissionsManagementCard />
        ) : (
          <NeonAdminTabPlaceholder title="Permissions" />
        )}
      </TabsContent>

      <TabsContent value="products">
        {legacySupabaseAdminTabs ? (
          <ProductManagementCard />
        ) : (
          <NeonAdminTabPlaceholder title="Products" />
        )}
      </TabsContent>

      <TabsContent value="customers">
        {legacySupabaseAdminTabs ? (
          <CustomersCard />
        ) : (
          <NeonAdminTabPlaceholder title="Customers" />
        )}
      </TabsContent>
    </Tabs>
  );
};
