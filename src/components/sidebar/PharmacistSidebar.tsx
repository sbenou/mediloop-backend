
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
  Users,
  ShoppingBag,
  CreditCard,
  FileText,
  ChevronRight,
  LogOut,
  Home,
  Upload,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useRecoilState } from "recoil";
import { authState } from "@/store/auth/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PharmacistSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [auth, setAuth] = useRecoilState(authState);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Logo upload logic would go here
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
                    onClick={() => navigate('/dashboard')}
                    className={cn(
                      "w-full flex justify-between items-center",
                      isActiveRoute('/dashboard') && "text-primary"
                    )}
                  >
                    <span className="flex items-center">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </SidebarMenuButton>
                </SidebarMenuItem>

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
          {profile && (
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{profile.full_name || 'Pharmacy User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-full"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default PharmacistSidebar;
