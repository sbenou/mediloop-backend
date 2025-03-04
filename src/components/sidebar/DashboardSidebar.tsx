
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
  Home,
  Upload,
  Receipt,
  Users,
  PackageSearch,
  Pill,
  Stethoscope,
  BarChart3,
  Shield,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hasSubmenu?: boolean;
  submenuItems?: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }[];
}

const DashboardSidebarContent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, userRole } = useAuth();
  const [auth, setAuth] = useRecoilState(authState);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isSuperAdmin = userRole === 'superadmin';

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isGroupExpanded = (groupName: string) => expandedGroups.includes(groupName);

  const navigateToView = (view: string, tab?: string) => {
    console.log(`Navigate to dashboard with view: ${view}${tab ? ` and tab: ${tab}` : ''}`);
    // Using navigate instead of direct link to prevent page refresh
    navigate(`/dashboard?view=${view}${tab ? `&${view}Tab=${tab}` : ''}`);
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

  const handleLogoClick = () => {
    if (isSuperAdmin && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image size should be less than 5MB",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('app_assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('app_assets')
        .getPublicUrl(fileName);
      
      setLogoUrl(urlData.publicUrl);
      
      toast({
        title: "Upload successful",
        description: "App logo has been updated",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading the logo. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Get menu items based on user role
  const getMenuItems = (): MenuItem[] => {
    // Common menu items for all roles
    const commonItems: MenuItem[] = [
      {
        icon: <Home className="h-4 w-4" />,
        label: "Dashboard",
        onClick: () => navigate('/dashboard'),
        hasSubmenu: false
      },
      {
        icon: <User className="h-4 w-4" />,
        label: "Profile",
        onClick: () => toggleGroup('profile'),
        hasSubmenu: true,
        submenuItems: [
          {
            icon: <User className="h-4 w-4" />,
            label: "Personal Information",
            onClick: () => navigateToView('profile', 'personal')
          },
          {
            icon: <MapPin className="h-4 w-4" />,
            label: "Addresses",
            onClick: () => navigateToView('profile', 'addresses')
          }
        ]
      },
      {
        icon: <Settings className="h-4 w-4" />,
        label: "Settings",
        onClick: () => navigateToView('settings'),
        hasSubmenu: false
      }
    ];
    
    // Role-specific menu items
    switch(userRole) {
      case 'patient':
        return [
          ...commonItems,
          {
            icon: <ShoppingBag className="h-4 w-4" />,
            label: "Orders",
            onClick: () => toggleGroup('orders'),
            hasSubmenu: true,
            submenuItems: [
              {
                icon: <ShoppingBag className="h-4 w-4" />,
                label: "My Orders",
                onClick: () => navigateToView('orders', 'orders')
              },
              {
                icon: <Receipt className="h-4 w-4" />,
                label: "Payments",
                onClick: () => navigateToView('orders', 'payments')
              }
            ]
          },
          {
            icon: <ClipboardList className="h-4 w-4" />,
            label: "My Prescriptions",
            onClick: () => navigateToView('prescriptions'),
            hasSubmenu: false
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: "Teleconsultations",
            onClick: () => navigateToView('teleconsultations'),
            hasSubmenu: false
          },
          // Add patient-specific submenu items to Profile
          {
            icon: null, // This is just for updating the profile submenu items
            label: "_profile_extension",
            onClick: () => {},
            submenuItems: [
              {
                icon: <Store className="h-4 w-4" />,
                label: "My Default Pharmacy",
                onClick: () => navigateToView('profile', 'pharmacy')
              },
              {
                icon: <UserRound className="h-4 w-4" />,
                label: "My Doctor",
                onClick: () => navigateToView('profile', 'doctor')
              },
              {
                icon: <Heart className="h-4 w-4" />,
                label: "Next of Kin",
                onClick: () => navigateToView('profile', 'nextofkin')
              }
            ]
          }
        ].filter(item => item.icon !== null); // Filter out the dummy items
        
      case 'doctor':
        return [
          ...commonItems,
          {
            icon: <Users className="h-4 w-4" />,
            label: "Patients",
            onClick: () => navigateToView('patients'),
            hasSubmenu: false
          },
          {
            icon: <Calendar className="h-4 w-4" />,
            label: "Appointments",
            onClick: () => navigateToView('appointments'),
            hasSubmenu: false
          },
          {
            icon: <FileText className="h-4 w-4" />,
            label: "Prescriptions",
            onClick: () => navigateToView('prescriptions'),
            hasSubmenu: false
          },
          // Add doctor-specific submenu items to Profile
          {
            icon: null,
            label: "_profile_extension",
            onClick: () => {},
            submenuItems: [
              {
                icon: <Stethoscope className="h-4 w-4" />,
                label: "Qualifications",
                onClick: () => navigateToView('profile', 'qualifications')
              },
              {
                icon: <MapPin className="h-4 w-4" />,
                label: "Clinic Details",
                onClick: () => navigateToView('profile', 'clinic')
              }
            ]
          }
        ].filter(item => item.icon !== null);
        
      case 'pharmacist':
        return [
          ...commonItems,
          {
            icon: <PackageSearch className="h-4 w-4" />,
            label: "Inventory",
            onClick: () => navigateToView('inventory'),
            hasSubmenu: false
          },
          {
            icon: <ShoppingBag className="h-4 w-4" />,
            label: "Orders",
            onClick: () => toggleGroup('orders'),
            hasSubmenu: true,
            submenuItems: [
              {
                icon: <ShoppingBag className="h-4 w-4" />,
                label: "Pending Orders",
                onClick: () => navigateToView('orders', 'pending')
              },
              {
                icon: <ShoppingBag className="h-4 w-4" />,
                label: "Completed Orders",
                onClick: () => navigateToView('orders', 'completed')
              }
            ]
          },
          {
            icon: <Pill className="h-4 w-4" />,
            label: "Prescriptions",
            onClick: () => navigateToView('prescriptions'),
            hasSubmenu: false
          },
          // Add pharmacist-specific submenu items to Profile
          {
            icon: null,
            label: "_profile_extension",
            onClick: () => {},
            submenuItems: [
              {
                icon: <Store className="h-4 w-4" />,
                label: "Pharmacy Details",
                onClick: () => navigateToView('profile', 'pharmacy')
              },
              {
                icon: <Users className="h-4 w-4" />,
                label: "Staff Management",
                onClick: () => navigateToView('profile', 'staff')
              }
            ]
          }
        ].filter(item => item.icon !== null);
        
      case 'superadmin':
        return [
          ...commonItems,
          {
            icon: <Users className="h-4 w-4" />,
            label: "Users",
            onClick: () => navigateToView('users'),
            hasSubmenu: false
          },
          {
            icon: <Store className="h-4 w-4" />,
            label: "Pharmacies",
            onClick: () => navigateToView('pharmacies'),
            hasSubmenu: false
          },
          {
            icon: <Stethoscope className="h-4 w-4" />,
            label: "Doctors",
            onClick: () => navigateToView('doctors'),
            hasSubmenu: false
          },
          {
            icon: <BarChart3 className="h-4 w-4" />,
            label: "Analytics",
            onClick: () => navigateToView('analytics'),
            hasSubmenu: false
          },
          {
            icon: <Shield className="h-4 w-4" />,
            label: "Permissions",
            onClick: () => navigateToView('permissions'),
            hasSubmenu: false
          }
        ];
        
      default:
        return commonItems;
    }
  };

  // Process menu items to handle profile extensions
  const processMenuItems = () => {
    const items = getMenuItems();
    
    // Find the profile item
    const profileItem = items.find(item => item.label === "Profile");
    if (!profileItem || !profileItem.submenuItems) return items;
    
    // Find any profile extensions
    const extensionItem = items.find(item => item.label === "_profile_extension");
    if (!extensionItem || !extensionItem.submenuItems) return items;
    
    // Merge the profile submenu items with the extension items
    profileItem.submenuItems = [...profileItem.submenuItems, ...extensionItem.submenuItems];
    
    // Filter out the extension item
    return items.filter(item => item.label !== "_profile_extension");
  };

  const menuItems = processMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div 
            className={cn(
              "bg-primary text-primary-foreground p-2 rounded-md overflow-hidden relative",
              isSuperAdmin && "cursor-pointer hover:opacity-90 transition-opacity"
            )}
            onClick={handleLogoClick}
          >
            {logoUrl ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={logoUrl} alt="Mediloop" />
                <AvatarFallback>
                  <FileText className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <FileText className="h-5 w-5" />
            )}
            
            {isSuperAdmin && (
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="h-3 w-3 text-white" />
              </div>
            )}
            
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="h-3 w-3 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            )}
            
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
            <p className="text-xs text-muted-foreground">Healthcare Platform</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex justify-between items-center",
                      isGroupExpanded(item.label.toLowerCase()) && item.hasSubmenu && "text-primary"
                    )}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </span>
                    {item.hasSubmenu ? (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isGroupExpanded(item.label.toLowerCase()) && "rotate-180"
                        )}
                      />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    )}
                  </SidebarMenuButton>
                  
                  {item.hasSubmenu && isGroupExpanded(item.label.toLowerCase()) && item.submenuItems && (
                    <div className="pl-6 space-y-1 mt-1">
                      {item.submenuItems.map((subItem, subIndex) => (
                        <SidebarMenuButton
                          key={subIndex}
                          onClick={subItem.onClick}
                          className="w-full text-sm flex items-center"
                        >
                          {subItem.icon}
                          <span className="ml-2">{subItem.label}</span>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
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
                  <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{profile?.email || 'user@example.com'}</p>
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
                <DropdownMenuItem onClick={() => navigateToView('profile')}>
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateToView('billing')}>
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateToView('settings')}>
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

const DashboardSidebar = () => {
  return (
    <SidebarProvider>
      <DashboardSidebarContent />
    </SidebarProvider>
  );
};

export default DashboardSidebar;
