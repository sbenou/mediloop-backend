
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarMenuSub, 
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider, 
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Users,
  CreditCard,
  Bell,
  Building2
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export function SuperAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system"
      });
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was a problem logging you out"
      });
    }
  };
  
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="pb-0">
          <Link to="/superadmin/dashboard" className="flex items-center gap-2 py-2 px-1">
            <img src="/favicon.ico" alt="Mediloop" className="w-6 h-6" />
            <span className="text-lg font-semibold">Mediloop</span>
          </Link>
          <SidebarTrigger className="absolute right-2 top-3" />
        </SidebarHeader>
        
        <SidebarContent>
          {/* Platform Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/superadmin/dashboard"}
                  >
                    <Link to="/superadmin/dashboard">
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Profile Collapsible */}
                <SidebarMenuItem>
                  <Collapsible 
                    open={isProfileOpen} 
                    onOpenChange={setIsProfileOpen}
                    className="w-full"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm rounded-md hover:bg-sidebar-accent">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isProfileOpen ? "transform rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/superadmin/profile" && location.search.includes("tab=personal")}
                          >
                            <Link to="/superadmin/profile?tab=personal">
                              Personal Information
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/superadmin/profile" && location.search.includes("tab=addresses")}
                          >
                            <Link to="/superadmin/profile?tab=addresses">
                              Addresses
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
                
                {/* Settings - IMPORTANT: This links to superadmin/settings, NOT settings */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/superadmin/settings"}
                  >
                    <Link to="/superadmin/settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Notifications */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/superadmin/notifications"}
                  >
                    <Link to="/superadmin/notifications">
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Billing */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/superadmin/billing"}
                  >
                    <Link to="/superadmin/billing">
                      <CreditCard className="h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Admin Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/admin-settings"}
                  >
                    <Link to="/admin-settings">
                      <Settings className="h-4 w-4" />
                      <span>Admin Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="mt-auto">
          <div className="px-3 py-2 flex flex-col">
            <div className="text-xs text-muted-foreground mb-2">
              Logged in as {profile?.role || 'superadmin'}
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

export default SuperAdminSidebar;
