
import { Users, UserCheck, Lock, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useDashboardStats } from "@/hooks/admin/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardProps {
  onCardClick: (tab: string) => void;
}

export const DashboardCards = ({ onCardClick }: DashboardCardProps) => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('users')}
        style={{ backgroundColor: "#D3E4FD" }} // Soft Blue
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/30">
              <Users className="h-6 w-6 text-gray-700" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-gray-800 mb-1">
                Users
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-gray-300" />
              ) : (
                <p className="text-sm text-gray-600">
                  {stats?.total_users || 0} registered
                </p>
              )}
            </div>
            <p className="text-sm text-gray-700">
              Manage user accounts and permissions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('roles')}
        style={{ backgroundColor: "#E5DEFF" }} // Soft Purple
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/30">
              <UserCheck className="h-6 w-6 text-gray-700" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-gray-800 mb-1">
                Roles
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-gray-300" />
              ) : (
                <p className="text-sm text-gray-600">
                  {stats?.total_roles || 0} active
                </p>
              )}
            </div>
            <p className="text-sm text-gray-700">
              Create and manage user roles
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('permissions')}
        style={{ backgroundColor: "#FDE1D3" }} // Soft Peach
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/30">
              <Lock className="h-6 w-6 text-gray-700" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-gray-800 mb-1">
                Permissions
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-gray-300" />
              ) : (
                <p className="text-sm text-gray-600">
                  {stats?.total_permissions || 0} defined
                </p>
              )}
            </div>
            <p className="text-sm text-gray-700">
              Configure system permissions and policies
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('products')}
        style={{ backgroundColor: "#F2FCE2" }} // Soft Green
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/30">
              <Box className="h-6 w-6 text-gray-700" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-gray-800 mb-1">
                Products
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-gray-300" />
              ) : (
                <p className="text-sm text-gray-600">
                  {stats?.total_products || 0} items
                </p>
              )}
            </div>
            <p className="text-sm text-gray-700">
              Manage product uploads and inventory
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
