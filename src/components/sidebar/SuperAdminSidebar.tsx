
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Settings,
  User,
  Home,
  Package,
  Lock,
  UserCheck,
  CreditCard,
  Bell,
  LogOut,
  MapPin,
  Grid,
  List,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/user-menu/UserAvatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const SuperAdminSidebar = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isActiveStartsWith = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isActiveTab = (tab: string) => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('tab') === tab;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-64 bg-white p-4 border-r border-gray-200 flex flex-col">
        <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-8 w-full bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        } h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm relative`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            {isSidebarOpen ? (
              <>
                <img
                  src="/mediloop-logo.svg"
                  alt="MediLoop"
                  className="h-8 w-8"
                />
                <span className="font-bold text-primary text-lg">MediLoop</span>
              </>
            ) : (
              <img
                src="/mediloop-logo.svg"
                alt="MediLoop"
                className="h-8 w-8"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8"
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform ${
                isSidebarOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-6">
            {isSidebarOpen ? (
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </h3>
            ) : (
              <div className="h-4"></div>
            )}
          </div>

          {/* Profile Section */}
          <Collapsible
            open={isProfileExpanded}
            onOpenChange={setIsProfileExpanded}
            className="mb-4"
          >
            <div className="px-4">
              <CollapsibleTrigger className="flex items-center w-full p-2 text-left text-gray-700 hover:bg-gray-100 rounded-md">
                <User className="h-5 w-5 mr-2" />
                {isSidebarOpen && (
                  <>
                    <span className="flex-1">Profile</span>
                    {isProfileExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </>
                )}
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="mt-1">
              {isSidebarOpen && (
                <>
                  <div
                    className={`flex items-center p-2 pl-12 text-gray-700 hover:bg-gray-100 cursor-pointer ${
                      isActive("/profile") && isActiveTab("personal")
                        ? "bg-gray-100 text-primary"
                        : ""
                    }`}
                    onClick={() => navigate("/profile?tab=personal")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>Personal Information</span>
                  </div>

                  <div
                    className={`flex items-center p-2 pl-12 text-gray-700 hover:bg-gray-100 cursor-pointer ${
                      isActive("/profile") && isActiveTab("addresses")
                        ? "bg-gray-100 text-primary"
                        : ""
                    }`}
                    onClick={() => navigate("/profile?tab=addresses")}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Addresses</span>
                  </div>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Admin Section */}
          <div className="px-4 mb-2">
            {isSidebarOpen && (
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </h3>
            )}
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActiveStartsWith("/admin-settings") && !location.search
                  ? "bg-gray-100 text-primary"
                  : ""
              }`}
              onClick={() => navigate("/admin-settings")}
            >
              <Settings className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Admin Settings</span>}
            </div>
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActiveStartsWith("/admin-settings") && isActiveTab("dashboard")
                  ? "bg-gray-100 text-primary"
                  : ""
              }`}
              onClick={() => navigate("/admin-settings?tab=dashboard")}
            >
              <Home className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Dashboard</span>}
            </div>
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActiveStartsWith("/admin-settings") && isActiveTab("users")
                  ? "bg-gray-100 text-primary"
                  : ""
              }`}
              onClick={() => navigate("/admin-settings?tab=users")}
            >
              <Users className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Users</span>}
            </div>
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActiveStartsWith("/admin-settings") && isActiveTab("roles")
                  ? "bg-gray-100 text-primary"
                  : ""
              }`}
              onClick={() => navigate("/admin-settings?tab=roles")}
            >
              <UserCheck className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Roles</span>}
            </div>
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActiveStartsWith("/admin-settings") && isActiveTab("permissions")
                  ? "bg-gray-100 text-primary"
                  : ""
              }`}
              onClick={() => navigate("/admin-settings?tab=permissions")}
            >
              <Lock className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Permissions</span>}
            </div>
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActiveStartsWith("/admin-settings") && isActiveTab("products")
                  ? "bg-gray-100 text-primary"
                  : ""
              }`}
              onClick={() => navigate("/admin-settings?tab=products")}
            >
              <Package className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Products</span>}
            </div>
          </div>

          <div className="px-4">
            <div
              className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer ${
                isActive("/admin-customers") ? "bg-gray-100 text-primary" : ""
              }`}
              onClick={() => navigate("/admin-customers")}
            >
              <Users className="h-5 w-5 mr-2" />
              {isSidebarOpen && <span>Customers</span>}
            </div>
          </div>
        </div>

        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                <UserAvatar userProfile={profile} />
                {isSidebarOpen && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                      {profile?.full_name || "Admin User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profile?.role || "SuperAdmin"}
                    </p>
                  </div>
                )}
                {isSidebarOpen && <ChevronRight className="h-4 w-4 rotate-90" />}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center">
                <UserAvatar userProfile={profile} />
                <div className="ml-2 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || "Admin User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email || "admin@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Upgrade to Pro
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile?tab=personal")}>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/billing")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  // We'll implement this later
                  toast({
                    title: "Notifications",
                    description: "Notifications will be implemented soon",
                  });
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
