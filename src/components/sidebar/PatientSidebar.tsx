
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  ChevronDown,
  User,
  MapPin,
  Store,
  UserRound,
  Heart,
  ShoppingBag,
  CreditCard,
  FileText,
  Calendar,
  Settings,
  ChevronRight,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
import UserAvatar from "../user-menu/UserAvatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";

const PatientSidebarContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [auth, setAuth] = useRecoilState(authState);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isGroupExpanded = (groupName: string) => expandedGroups.includes(groupName);

  const navigateToTab = (path: string, tab?: string) => {
    console.log(`Navigate to: ${path}${tab ? `?tab=${tab}` : ''}`);
    navigate(path + (tab ? `?tab=${tab}` : ''));
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuth({
        user: null,
        profile: null,
        isLoading: false,
        permissions: [],
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-md">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Mediloop</h3>
            <p className="text-xs text-muted-foreground">Healthcare Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => toggleGroup('profile')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    isGroupExpanded('profile') && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isGroupExpanded('profile') && "rotate-180"
                    )}
                  />
                </SidebarMenuButton>
                {isGroupExpanded('profile') && (
                  <div className="pl-6 space-y-1 mt-1">
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/profile', 'personal')}
                      className="w-full text-sm"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Personal Information
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/profile', 'addresses')}
                      className="w-full text-sm"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/profile', 'pharmacy')}
                      className="w-full text-sm"
                    >
                      <Store className="mr-2 h-4 w-4" />
                      My Default Pharmacy
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/profile', 'doctor')}
                      className="w-full text-sm"
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      My Doctor
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/profile', 'nextofkin')}
                      className="w-full text-sm"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Next of Kin
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => toggleGroup('orders')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    isGroupExpanded('orders') && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Orders
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isGroupExpanded('orders') && "rotate-180"
                    )}
                  />
                </SidebarMenuButton>
                {isGroupExpanded('orders') && (
                  <div className="pl-6 space-y-1 mt-1">
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/my-orders', 'orders')}
                      className="w-full text-sm"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      My Orders
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToTab('/my-orders', 'payments')}
                      className="w-full text-sm"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      My Payments
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToTab('/my-prescriptions')}
                  className="w-full flex justify-between items-center"
                >
                  <span className="flex items-center">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    My Prescriptions
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToTab('/teleconsultations')}
                  className="w-full flex justify-between items-center"
                >
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Teleconsultations
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToTab('/settings')}
                  className="w-full flex justify-between items-center"
                >
                  <span className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t mt-auto p-4">
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer">
                <UserAvatar userProfile={profile} />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{profile.full_name || 'sam testington'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email || 'bencu004@hotmail.com'}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')}>
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

const PatientSidebar = () => {
  return (
    <SidebarProvider>
      <PatientSidebarContent />
    </SidebarProvider>
  );
};

export default PatientSidebar;
