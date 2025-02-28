
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, UserCheck, Lock, Box, Stethoscope } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardCards } from "../DashboardCards";
import { UserManagementTable } from "../UserManagementTable";
import { RoleManagementTable } from "../RoleManagementTable";
import { PermissionsManagementCard } from "./PermissionsManagementCard";
import { ProductManagementCard } from "./ProductManagementCard";
import { CustomersCard } from "./CustomersCard";

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
    navigate(`/admin-settings?tab=${value}`);
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
        <RoleManagementTable />
      </TabsContent>

      <TabsContent value="permissions">
        <PermissionsManagementCard />
      </TabsContent>

      <TabsContent value="products">
        <ProductManagementCard />
      </TabsContent>

      <TabsContent value="customers">
        <CustomersCard />
      </TabsContent>
    </Tabs>
  );
};
