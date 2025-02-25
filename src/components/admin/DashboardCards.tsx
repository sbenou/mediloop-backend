
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
        style={{ backgroundColor: "#2A7A9B" }} // Teal
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/10">
              <Users className="h-6 w-6 text-white" />
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-white mb-1">
                Users
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-white/20" />
              ) : (
                <p className="text-sm text-white/70">
                  {stats?.total_users || 0} registered
                </p>
              )}
            </div>
            <p className="text-sm text-white/90">
              Manage user accounts and permissions
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('roles')}
        style={{ backgroundColor: "#176D4A" }} // Green
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/10">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-white mb-1">
                Roles
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-white/20" />
              ) : (
                <p className="text-sm text-white/70">
                  {stats?.total_roles || 0} active
                </p>
              )}
            </div>
            <p className="text-sm text-white/90">
              Create and manage user roles
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('permissions')}
        style={{ backgroundColor: "#BF7F21" }} // Orange/Brown
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/10">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-white mb-1">
                Permissions
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-white/20" />
              ) : (
                <p className="text-sm text-white/70">
                  {stats?.total_permissions || 0} defined
                </p>
              )}
            </div>
            <p className="text-sm text-white/90">
              Configure system permissions and policies
            </p>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('products')}
        style={{ backgroundColor: "#6C3894" }} // Purple
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-full bg-white/10">
              <Box className="h-6 w-6 text-white" />
            </div>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div>
              <CardTitle className="text-xl font-medium text-white mb-1">
                Products
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-20 bg-white/20" />
              ) : (
                <p className="text-sm text-white/70">
                  {stats?.total_products || 0} items
                </p>
              )}
            </div>
            <p className="text-sm text-white/90">
              Manage product uploads and inventory
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
