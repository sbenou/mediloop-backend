
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Home,
  User,
  Settings,
  LogOut,
  ShoppingBag,
  FileText,
  Users,
  Building,
  CreditCard,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import UserAvatar from "../user-menu/UserAvatar";

const UnifiedSidebar = () => {
  const { isAuthenticated, userRole, profile } = useAuth();
  const location = useLocation();

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const getLinkPrefix = () => {
    switch (userRole) {
      case "superadmin":
        return "/superadmin";
      case "pharmacist":
        return "/pharmacy";
      default:
        return "";
    }
  };

  const linkPrefix = getLinkPrefix();

  // Render menu items based on user role
  const renderRoleSpecificLinks = () => {
    if (userRole === "patient" || !userRole) {
      return (
        <>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/my-prescriptions")}
              tooltip="Prescriptions"
            >
              <Link to="/my-prescriptions" className="flex items-center w-full">
                <FileText className="mr-2" />
                <span>My Prescriptions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/my-orders")}
              tooltip="Orders"
            >
              <Link to="/my-orders" className="flex items-center w-full">
                <ShoppingBag className="mr-2" />
                <span>My Orders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/doctor-connections")}
              tooltip="Doctors"
            >
              <Link to="/doctor-connections" className="flex items-center w-full">
                <Stethoscope className="mr-2" />
                <span>My Doctors</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      );
    } else if (userRole === "pharmacist") {
      return (
        <>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/pharmacy/patients")}
              tooltip="Patients"
            >
              <Link to="/pharmacy/patients" className="flex items-center w-full">
                <Users className="mr-2" />
                <span>Patients</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/pharmacy/prescriptions")}
              tooltip="Prescriptions"
            >
              <Link to="/pharmacy/prescriptions" className="flex items-center w-full">
                <FileText className="mr-2" />
                <span>Prescriptions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/pharmacy/orders")}
              tooltip="Orders"
            >
              <Link to="/pharmacy/orders" className="flex items-center w-full">
                <ShoppingBag className="mr-2" />
                <span>Orders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      );
    } else if (userRole === "superadmin") {
      return (
        <>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/superadmin/users")}
              tooltip="Users"
            >
              <Link to="/superadmin/users" className="flex items-center w-full">
                <Users className="mr-2" />
                <span>Users</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/admin-settings")}
              tooltip="Admin Settings"
            >
              <Link to="/admin-settings" className="flex items-center w-full">
                <Settings className="mr-2" />
                <span>Admin Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isLinkActive("/superadmin/billing")}
              tooltip="Billing"
            >
              <Link to="/superadmin/billing" className="flex items-center w-full">
                <CreditCard className="mr-2" />
                <span>Billing</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      );
    }
    return null;
  };

  // Don't render sidebar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-4">
        <div className="text-xl font-bold">MedConnect</div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Common Platform Links */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isLinkActive(`${linkPrefix}/dashboard`) || isLinkActive("/dashboard")}
                tooltip="Dashboard"
              >
                <Link to={userRole === "patient" || !userRole ? "/dashboard" : `${linkPrefix}/dashboard`} className="flex items-center w-full">
                  <Home className="mr-2" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isLinkActive(`${linkPrefix}/profile`) || isLinkActive("/profile") || isLinkActive("/unified-profile")}
                tooltip="Profile"
              >
                <Link to={userRole === "patient" || !userRole ? "/profile" : `${linkPrefix}/profile`} className="flex items-center w-full">
                  <User className="mr-2" />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isLinkActive(`${linkPrefix}/settings`) || isLinkActive("/settings")}
                tooltip="Settings"
              >
                <Link to={userRole === "patient" || !userRole ? "/settings" : `${linkPrefix}/settings`} className="flex items-center w-full">
                  <Settings className="mr-2" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        {/* Role-specific Links */}
        <SidebarGroup>
          <SidebarGroupLabel>{userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Patient"} Menu</SidebarGroupLabel>
          <SidebarMenu>
            {renderRoleSpecificLinks()}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {userRole === "pharmacist" ? (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <UserAvatar userProfile={profile} />
            )}
            <div>
              <div className="text-sm font-medium">{profile?.full_name || "User"}</div>
              <div className="text-xs text-muted-foreground">{userRole || "patient"}</div>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UnifiedSidebar;
