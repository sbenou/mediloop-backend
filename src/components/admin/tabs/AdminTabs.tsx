
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Shield, Box } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardCards } from "../DashboardCards";
import { UserManagementTable } from "../UserManagementTable";
import { RoleManagementTable } from "../RoleManagementTable";
import { PermissionsManagementCard } from "./PermissionsManagementCard";
import { ProductManagementCard } from "./ProductManagementCard";

export const AdminTabs = ({ users, isLoading, updateUserRole }: {
  users?: any[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const getIconColor = (tabName: string) => {
    if (activeTab !== tabName) return "currentColor";
    
    switch (tabName) {
      case 'users':
        return "#1d4ed8"; // text-blue-700
      case 'roles':
        return "#7e22ce"; // text-purple-700
      case 'permissions':
        return "#be123c"; // text-rose-700
      case 'products':
        return "#047857"; // text-emerald-700
      default:
        return "currentColor";
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/admin-settings?tab=${value}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList>
        <TabsTrigger value="dashboard">
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="h-4 w-4 mr-2" color={getIconColor('users')} />
          Users
        </TabsTrigger>
        <TabsTrigger value="roles">
          <Shield className="h-4 w-4 mr-2" color={getIconColor('roles')} />
          Roles
        </TabsTrigger>
        <TabsTrigger value="permissions">
          <Shield className="h-4 w-4 mr-2" color={getIconColor('permissions')} />
          Permissions
        </TabsTrigger>
        <TabsTrigger value="products">
          <Box className="h-4 w-4 mr-2" color={getIconColor('products')} />
          Products
        </TabsTrigger>
      </TabsList>

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
        <RoleManagementTable />
      </TabsContent>

      <TabsContent value="permissions">
        <PermissionsManagementCard />
      </TabsContent>

      <TabsContent value="products">
        <ProductManagementCard />
      </TabsContent>
    </Tabs>
  );
};
