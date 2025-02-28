
import { useState, useRef, useEffect } from "react";
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
  Users,
  ShoppingBag,
  CreditCard,
  FileText,
  ChevronRight,
  LogOut,
  Bell,
  User,
  Settings,
  Camera,
  Building,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader } from "@/components/ui/card";

const PharmacistSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [auth, setAuth] = useRecoilState(authState);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [pharmacyLogo, setPharmacyLogo] = useState<string | null>(null);
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isGroupExpanded = (groupName: string) => expandedGroups.includes(groupName);
  
  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from PharmacistSidebar");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase signOut error:", error);
        throw error;
      }
      
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
      
      // Force redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Logo upload logic would go here
  };

  const handlePharmacyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // In a real implementation, we would upload to Supabase storage here
      // For now, create a temporary URL to display the image
      const objectUrl = URL.createObjectURL(file);
      setPharmacyLogo(objectUrl);
      
      toast({
        title: "Logo uploaded",
        description: "Pharmacy logo has been updated successfully",
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading the pharmacy logo.",
      });
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div 
              className="bg-primary text-primary-foreground p-2 rounded-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-5 w-5" />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Mediloop</h3>
              <p className="text-xs text-muted-foreground">Pharmacy Portal</p>
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
                    onClick={() => toggleGroup('patients')}
                    className={cn(
                      "w-full flex justify-between items-center",
                      (isGroupExpanded('patients') || isActiveRoute('/pharmacy/patients')) && "text-primary"
                    )}
                  >
                    <span className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Patients
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isGroupExpanded('patients') && "rotate-180"
                      )}
                    />
                  </SidebarMenuButton>
                  {isGroupExpanded('patients') && (
                    <div className="pl-6 space-y-1 mt-1">
                      <SidebarMenuButton
                        onClick={() => navigate('/pharmacy/patients')}
                        className={cn(
                          "w-full text-sm",
                          isActiveRoute('/pharmacy/patients') && "text-primary"
                        )}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        All Patients
                      </SidebarMenuButton>
                    </div>
                  )}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => toggleGroup('orders')}
                    className={cn(
                      "w-full flex justify-between items-center",
                      (isGroupExpanded('orders') || isActiveRoute('/pharmacy/orders')) && "text-primary"
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
                        onClick={() => navigate('/pharmacy/orders?tab=all')}
                        className={cn(
                          "w-full text-sm",
                          (isActiveRoute('/pharmacy/orders') && !location.search.includes('tab=payments')) && "text-primary"
                        )}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        All Orders
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        onClick={() => navigate('/pharmacy/orders?tab=payments')}
                        className={cn(
                          "w-full text-sm",
                          (isActiveRoute('/pharmacy/orders') && location.search.includes('tab=payments')) && "text-primary"
                        )}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        All Payments
                      </SidebarMenuButton>
                    </div>
                  )}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/pharmacy/prescriptions')}
                    className={cn(
                      "w-full flex justify-between items-center",
                      isActiveRoute('/pharmacy/prescriptions') && "text-primary"
                    )}
                  >
                    <span className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Prescriptions
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t mt-auto p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 rounded-md p-2 transition-colors">
                <div className="bg-secondary p-2 rounded-md">
                  {pharmacyLogo ? (
                    <img 
                      src={pharmacyLogo} 
                      alt="Pharmacy Logo" 
                      className="h-5 w-5 object-cover"
                    />
                  ) : (
                    <Building className="h-5 w-5 text-primary/60" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{pharmacyName || "Pharmacy"}</h3>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="top" sideOffset={10}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Profile'} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{profile?.full_name || 'Pharmacy User'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/upgrade')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')}>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Hidden input for pharmacy logo upload */}
          <input 
            type="file" 
            ref={logoInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handlePharmacyLogoChange}
          />
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default PharmacistSidebar;
