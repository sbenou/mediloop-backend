
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
  Pill,
  CalendarClock,
  ShoppingBag,
  MapPin,
  Building,
  UserCircle,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const PatientSidebar = () => {
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
          <Link to="/dashboard" className="flex items-center gap-2 py-2 px-1">
            <img src="/favicon.ico" alt="Mediloop" className="w-6 h-6" />
            <span className="text-lg font-semibold">Mediloop</span>
          </Link>
          <SidebarTrigger className="absolute right-2 top-3" />
        </SidebarHeader>
        
        <SidebarContent>
          {/* Main Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/dashboard" && !location.search.includes("view=")}
                  >
                    <Link to="/dashboard">
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
                            isActive={location.pathname === "/dashboard" && location.search.includes("view=profile") && location.search.includes("profileTab=personal")}
                          >
                            <Link to="/dashboard?view=profile&profileTab=personal">
                              Personal Details
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/dashboard" && location.search.includes("view=profile") && location.search.includes("profileTab=addresses")}
                          >
                            <Link to="/dashboard?view=profile&profileTab=addresses">
                              Addresses
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/dashboard" && location.search.includes("view=profile") && location.search.includes("profileTab=pharmacy")}
                          >
                            <Link to="/dashboard?view=profile&profileTab=pharmacy">
                              Pharmacy
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/dashboard" && location.search.includes("view=profile") && location.search.includes("profileTab=doctor")}
                          >
                            <Link to="/dashboard?view=profile&profileTab=doctor">
                              Doctor
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSubButton 
                            asChild 
                            isActive={location.pathname === "/dashboard" && location.search.includes("view=profile") && location.search.includes("profileTab=nextofkin")}
                          >
                            <Link to="/dashboard?view=profile&profileTab=nextofkin">
                              Next of Kin
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
                
                {/* Orders */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/dashboard" && location.search.includes("view=orders")}
                  >
                    <Link to="/dashboard?view=orders">
                      <ShoppingBag className="h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Prescriptions */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/dashboard" && location.search.includes("view=prescriptions")}
                  >
                    <Link to="/dashboard?view=prescriptions">
                      <Pill className="h-4 w-4" />
                      <span>Prescriptions</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Teleconsultations */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/dashboard" && location.search.includes("view=teleconsultations")}
                  >
                    <Link to="/dashboard?view=teleconsultations">
                      <CalendarClock className="h-4 w-4" />
                      <span>Teleconsultations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Settings */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === "/dashboard" && location.search.includes("view=settings")}
                  >
                    <Link to="/dashboard?view=settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
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
              Logged in as {profile?.role || 'patient'}
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
};

export default PatientSidebar;
