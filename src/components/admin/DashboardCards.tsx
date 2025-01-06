import { LayoutDashboard, Users, Shield, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  onCardClick: (tab: string) => void;
}

export const DashboardCards = ({ onCardClick }: DashboardCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('users')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('roles')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Roles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create and manage user roles
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('permissions')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Permissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure system permissions and policies
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('products')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Box className="h-5 w-5 text-primary" />
            <span>Products</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage product uploads and inventory
          </p>
        </CardContent>
      </Card>
    </div>
  );
};