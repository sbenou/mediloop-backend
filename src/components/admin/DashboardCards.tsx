
import { Users, UserCheck, Lock, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  onCardClick: (tab: string) => void;
}

export const DashboardCards = ({ onCardClick }: DashboardCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-200 to-blue-300 border-blue-400"
        onClick={() => onCardClick('users')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-700" />
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
        className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-200 to-purple-300 border-purple-400"
        onClick={() => onCardClick('roles')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-purple-700" />
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
        className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-rose-200 to-rose-300 border-rose-400"
        onClick={() => onCardClick('permissions')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-rose-700" />
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
        className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-200 to-emerald-300 border-emerald-400"
        onClick={() => onCardClick('products')}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Box className="h-5 w-5 text-emerald-700" />
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
