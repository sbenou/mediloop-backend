
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  ChevronRight, 
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

export function SuperAdminSidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
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
                            isActive={location.pathname === "/profile" && location.search.includes("tab=personal")}
                          >
                            <Link to="/profile?tab=personal">
                              Personal Information
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/profile" && location.search.includes("tab=addresses")}
                          >
                            <Link to="/profile?tab=addresses">
                              Addresses
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
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
                    isActive={location.pathname === "/settings"}
                  >
                    <Link to="/settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/admin-settings"}
                  >
                    <Link to="/admin-settings">
                      <Building2 className="h-4 w-4" />
                      <span>Admin Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="mt-auto">
          <div className="px-3 py-2">
            <div className="text-xs text-muted-foreground">
              Logged in as {profile?.role || 'superadmin'}
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

export default SuperAdminSidebar;
