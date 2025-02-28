
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { RoleManagementTable } from "@/components/admin/RoleManagementTable";
import { PermissionsManagementCard } from "./PermissionsManagementCard";
import { ProductManagementCard } from "./ProductManagementCard";
import { UserProfile } from "@/types/user";
import { CustomerManagementTable } from "@/components/admin/CustomerManagementTable";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface AdminTabsProps {
  users?: UserProfile[];
  customers?: UserProfile[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: UserProfile['role']) => Promise<void>;
  activeTab?: string;
}

export const AdminTabs = ({ 
  users = [], 
  customers = [],
  isLoading, 
  updateUserRole,
  activeTab = "users"
}: AdminTabsProps) => {
  const navigate = useNavigate();

  const handleTabChange = (value: string) => {
    navigate(`/admin-settings?tab=${value}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="roles">Roles</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
      </TabsList>
      
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
      
      <TabsContent value="customers">
        <CustomerManagementTable 
          customers={customers} 
          isLoading={isLoading} 
          updateUserRole={updateUserRole} 
        />
      </TabsContent>
      
      <TabsContent value="products">
        <ProductManagementCard />
      </TabsContent>
    </Tabs>
  );
};
