
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  User,
  MapPin,
  Home,
  Users,
  Store,
  UserPlus,
  Settings,
  ShoppingBag,
  CreditCard,
  Pill,
  Shield,
  KeyRound,
  Package,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, path, active, collapsed, onClick }: SidebarItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
    if (onClick) {
      onClick();
    }
  };

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-2 gap-2",
                active && "bg-accent text-accent-foreground"
              )}
              onClick={handleClick}
            >
              <span className="flex-shrink-0">{icon}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start px-2 gap-2",
        active && "bg-accent text-accent-foreground"
      )}
      onClick={handleClick}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Button>
  );
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<string[]>(["profile"]);
  const { userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Define base path for profile tabs
  const getProfileTabPath = (tab: string) => `/profile?tab=${tab}`;

  // Check if current path is a profile tab
  const isProfileTab = (tab: string) => {
    const searchParams = new URLSearchParams(location.search);
    return location.pathname === "/profile" && searchParams.get("tab") === tab;
  };

  // Check if a path is active
  const isActivePath = (path: string) => location.pathname === path;

  // Add active state for profile accordion
  useEffect(() => {
    if (location.pathname === "/profile" && !openAccordions.includes("profile")) {
      setOpenAccordions([...openAccordions, "profile"]);
    }
  }, [location.pathname, openAccordions]);

  // Handle accordion change
  const handleAccordionChange = (value: string) => {
    setOpenAccordions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-background border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo and collapse button */}
      <div className="p-4 border-b flex justify-between items-center">
        {!collapsed && (
          <div className="font-semibold text-lg">
            MediConnect
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggleCollapse}>
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Conditional platform section for pharmacists */}
      {userRole === "pharmacist" && (
        <div className={cn("p-4 border-b", collapsed && "flex justify-center")}>
          {!collapsed && <div className="text-sm font-medium text-muted-foreground mb-2">Platform</div>}
        </div>
      )}

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Profile section */}
        {collapsed ? (
          <SidebarItem
            icon={<User size={20} />}
            label="Profile"
            path="/profile"
            active={location.pathname === "/profile"}
            collapsed={collapsed}
          />
        ) : (
          <Accordion
            type="multiple"
            value={openAccordions}
            onValueChange={setOpenAccordions}
            className="w-full"
          >
            <AccordionItem value="profile" className="border-0">
              <AccordionTrigger className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <span>Profile</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <div className="flex flex-col pl-2 space-y-1">
                  <SidebarItem
                    icon={<User size={18} />}
                    label="Personal Information"
                    path={getProfileTabPath("personal")}
                    active={isProfileTab("personal")}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<MapPin size={18} />}
                    label="Addresses"
                    path={getProfileTabPath("addresses")}
                    active={isProfileTab("addresses")}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<Store size={18} />}
                    label="My Pharmacy"
                    path={getProfileTabPath("pharmacy")}
                    active={isProfileTab("pharmacy")}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<User size={18} />}
                    label="My Doctor"
                    path={getProfileTabPath("doctor")}
                    active={isProfileTab("doctor")}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<UserPlus size={18} />}
                    label="Next of Kin"
                    path={getProfileTabPath("nextofkin")}
                    active={isProfileTab("nextofkin")}
                    collapsed={collapsed}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Orders section */}
        {collapsed ? (
          <SidebarItem
            icon={<ShoppingBag size={20} />}
            label="Orders"
            path="/my-orders"
            active={location.pathname === "/my-orders"}
            collapsed={collapsed}
          />
        ) : (
          <Accordion
            type="multiple"
            value={openAccordions}
            onValueChange={setOpenAccordions}
            className="w-full"
          >
            <AccordionItem value="orders" className="border-0">
              <AccordionTrigger className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} />
                  <span>Orders</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <div className="flex flex-col pl-2 space-y-1">
                  <SidebarItem
                    icon={<ShoppingBag size={18} />}
                    label="My Orders"
                    path="/my-orders"
                    active={isActivePath("/my-orders")}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<CreditCard size={18} />}
                    label="My Payments"
                    path="/my-payments"
                    active={isActivePath("/my-payments")}
                    collapsed={collapsed}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Prescriptions */}
        <div className="px-3 py-2">
          <SidebarItem
            icon={<Pill size={20} />}
            label="My Prescriptions"
            path="/my-prescriptions"
            active={isActivePath("/my-prescriptions")}
            collapsed={collapsed}
          />
        </div>

        {/* Admin section - only for admins and superadmins */}
        {(userRole === "admin" || userRole === "superadmin") && (
          collapsed ? (
            <SidebarItem
              icon={<Settings size={20} />}
              label="Admin"
              path="/admin-settings"
              active={location.pathname === "/admin-settings"}
              collapsed={collapsed}
            />
          ) : (
            <Accordion
              type="multiple"
              value={openAccordions}
              onValueChange={setOpenAccordions}
              className="w-full"
            >
              <AccordionItem value="admin" className="border-0">
                <AccordionTrigger className="px-4 py-2 hover:bg-accent hover:text-accent-foreground rounded-md">
                  <div className="flex items-center gap-2">
                    <Settings size={20} />
                    <span>Admin</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-0">
                  <div className="flex flex-col pl-2 space-y-1">
                    <SidebarItem
                      icon={<Settings size={18} />}
                      label="Settings"
                      path="/settings"
                      active={isActivePath("/settings")}
                      collapsed={collapsed}
                    />
                    
                    {/* Super admin only */}
                    {userRole === "superadmin" && (
                      <>
                        <SidebarItem
                          icon={<Shield size={18} />}
                          label="Admin Settings"
                          path="/admin-settings"
                          active={isActivePath("/admin-settings")}
                          collapsed={collapsed}
                        />
                        <SidebarItem
                          icon={<Users size={18} />}
                          label="Users"
                          path="/admin-users"
                          active={isActivePath("/admin-users")}
                          collapsed={collapsed}
                        />
                        <SidebarItem
                          icon={<KeyRound size={18} />}
                          label="Roles"
                          path="/admin-roles"
                          active={isActivePath("/admin-roles")}
                          collapsed={collapsed}
                        />
                        <SidebarItem
                          icon={<Shield size={18} />}
                          label="Permissions"
                          path="/admin-permissions"
                          active={isActivePath("/admin-permissions")}
                          collapsed={collapsed}
                        />
                        <SidebarItem
                          icon={<Package size={18} />}
                          label="Products"
                          path="/admin-products"
                          active={isActivePath("/admin-products")}
                          collapsed={collapsed}
                        />
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )
        )}
      </div>
    </div>
  );
};
