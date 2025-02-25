
import { Users, UserCheck, Lock, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface DashboardCardProps {
  onCardClick: (tab: string) => void;
}

export const DashboardCards = ({ onCardClick }: DashboardCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow border-0"
        onClick={() => onCardClick('users')}
        style={{ backgroundColor: "#2A7A9B" }} // Teal color like in image
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
              <p className="text-sm text-white/70">
                450 registered
              </p>
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
        style={{ backgroundColor: "#176D4A" }} // Green color like in image
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
              <p className="text-sm text-white/70">
                16 active
              </p>
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
        style={{ backgroundColor: "#BF7F21" }} // Orange/Brown color like in image
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
              <p className="text-sm text-white/70">
                (Profiles)
              </p>
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
        style={{ backgroundColor: "#6C3894" }} // Purple color like in image
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
              <p className="text-sm text-white/70">
                (Inventory)
              </p>
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
