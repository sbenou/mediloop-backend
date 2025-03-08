
import { useState, useRef } from "react";
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
  ChevronRight,
  Users,
  ShoppingBag,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
  SquareUser,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import UserAvatar from "@/components/user-menu/UserAvatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";

const PharmacistSidebarContent = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Check the current section from the URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const section = searchParams.get("section") || "dashboard";
  
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isGroupExpanded = (groupName: string) => expandedGroups.includes(groupName);

  const navigateToPharmacyView = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy view: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    navigate(`/dashboard?view=pharmacy&section=${section}${tab && tabParam ? `&${tabParam}=${tab}` : ''}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile?.id) {
      try {
        toast({
          title: "Uploading photo",
          description: "Your profile picture is being updated...",
        });

        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;

        const filePath = `${userId}/${crypto.randomUUID()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });

        // Force reload to show new avatar
        window.location.reload();
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile picture",
        });
      }
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 rounded-md bg-primary/10">
            <AvatarFallback className="rounded-md text-primary">
              <SquareUser className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">Pharmacy Panel</h3>
            <p className="text-xs text-muted-foreground">Mediloop Healthcare</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToPharmacyView('dashboard')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    section === 'dashboard' && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToPharmacyView('patients')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    section === 'patients' && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Patients
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => toggleGroup('orders')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    section === 'orders' && "text-primary",
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
                      onClick={() => navigateToPharmacyView('orders', 'orders', 'ordersTab')}
                      className={cn(
                        "w-full text-sm",
                        section === 'orders' && searchParams.get('ordersTab') === 'orders' && "text-primary"
                      )}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      All Orders
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToPharmacyView('orders', 'pending', 'ordersTab')}
                      className={cn(
                        "w-full text-sm",
                        section === 'orders' && searchParams.get('ordersTab') === 'pending' && "text-primary"
                      )}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Pending
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToPharmacyView('prescriptions')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    section === 'prescriptions' && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Prescriptions
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => toggleGroup('profile')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    section === 'profile' && "text-primary",
                    isGroupExpanded('profile') && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" />
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
                      onClick={() => navigateToPharmacyView('profile', 'personal', 'profileTab')}
                      className={cn(
                        "w-full text-sm",
                        section === 'profile' && searchParams.get('profileTab') === 'personal' && "text-primary"
                      )}
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Personal Info
                    </SidebarMenuButton>
                    <SidebarMenuButton
                      onClick={() => navigateToPharmacyView('profile', 'security', 'profileTab')}
                      className={cn(
                        "w-full text-sm",
                        section === 'profile' && searchParams.get('profileTab') === 'security' && "text-primary"
                      )}
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Security
                    </SidebarMenuButton>
                  </div>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigateToPharmacyView('settings')}
                  className={cn(
                    "w-full flex justify-between items-center",
                    section === 'settings' && "text-primary"
                  )}
                >
                  <span className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="w-full flex justify-between items-center text-red-500 hover:text-red-600"
                >
                  <span className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </span>
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
                <div onClick={handleAvatarClick}>
                  <UserAvatar 
                    userProfile={profile} 
                    canUpload={true} 
                    onAvatarClick={handleAvatarClick}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email || ''}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigateToPharmacyView('profile')}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateToPharmacyView('settings')}>
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

const PharmacistSidebar = () => {
  return (
    <SidebarProvider>
      <PharmacistSidebarContent />
    </SidebarProvider>
  );
};

export default PharmacistSidebar;
