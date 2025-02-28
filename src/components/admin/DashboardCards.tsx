
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductManagementCard } from "./tabs/ProductManagementCard";
import { PermissionsManagementCard } from "./tabs/PermissionsManagementCard";
import { CustomersCard } from "./tabs/CustomersCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Lock, Box, Stethoscope } from "lucide-react";

interface DashboardCardsProps {
  onCardClick?: (value: string) => void;
}

export const DashboardCards = ({ onCardClick }: DashboardCardsProps = {}) => {
  const handleTabChange = (value: string) => {
    if (onCardClick) {
      onCardClick(value);
    }
  };

  return (
    <Tabs defaultValue="dashboard" className="w-full" onValueChange={handleTabChange}>
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors" 
                onClick={() => onCardClick && onCardClick('users')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Users</div>
              <p className="text-xs text-muted-foreground mt-1">
                View and manage user accounts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer transition-colors"
                onClick={() => onCardClick && onCardClick('roles')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Roles</div>
              <p className="text-xs text-muted-foreground mt-1">
                Create and assign user roles
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                onClick={() => onCardClick && onCardClick('permissions')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
              <Lock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Permissions</div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure access control
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors"
                onClick={() => onCardClick && onCardClick('products')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Box className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Products</div>
              <p className="text-xs text-muted-foreground mt-1">
                Control product inventory
              </p>
            </CardContent>
          </Card>

          <Card className="bg-teal-50 border-teal-200 hover:bg-teal-100 cursor-pointer transition-colors"
                onClick={() => onCardClick && onCardClick('customers')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Stethoscope className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Customers</div>
              <p className="text-xs text-muted-foreground mt-1">
                View doctors and pharmacists
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="products">
        <ProductManagementCard />
      </TabsContent>
      
      <TabsContent value="customers">
        <CustomersCard />
      </TabsContent>
      
      <TabsContent value="permissions">
        <PermissionsManagementCard />
      </TabsContent>
    </Tabs>
  );
};
