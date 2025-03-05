
import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Home, Settings, FileText, Phone, Package, UserPlus, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import SidebarUserMenu from "./SidebarUserMenu";

const UnifiedSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = profile?.role || "user";

  const routes = useMemo(() => {
    const baseRoutes = [
      {
        name: "Home",
        path: "/",
        icon: Home,
      },
      {
        name: "Products",
        path: "/products",
        icon: Package,
      },
      {
        name: "Prescriptions",
        path: "/my-prescriptions",
        icon: FileText,
      },
      {
        name: "Teleconsultations",
        path: "/teleconsultations",
        icon: Phone,
      },
      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ];

    // If user is a pharmacist, add pharmacist-specific routes
    if (userRole === "pharmacist") {
      return [
        {
          name: "Dashboard",
          path: "/pharmacy",
          icon: Home,
        },
        {
          name: "Orders",
          path: "/pharmacy/orders",
          icon: Package,
        },
        {
          name: "Prescriptions",
          path: "/pharmacy/prescriptions",
          icon: FileText,
        },
        {
          name: "Patients",
          path: "/pharmacy/patients",
          icon: UserPlus,
        },
        {
          name: "Settings",
          path: "/pharmacy/settings",
          icon: Settings,
        },
      ];
    }

    // If user is a superadmin, add admin-specific routes
    if (userRole === "superadmin") {
      return [
        {
          name: "Dashboard",
          path: "/superadmin",
          icon: Home,
        },
        {
          name: "Users",
          path: "/superadmin/users",
          icon: UserCircle,
        },
        {
          name: "Products",
          path: "/superadmin/products",
          icon: Package,
        },
        {
          name: "Settings",
          path: "/superadmin/settings",
          icon: Settings,
        },
      ];
    }

    // Default to base routes
    return baseRoutes;
  }, [userRole]);

  return (
    <Sidebar>
      <SidebarRail />
      <SidebarHeader className="h-16 flex items-center justify-center">
        <img src="/logo.svg" alt="Logo" className="h-8" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {routes.map((route) => (
            <SidebarMenuItem key={route.path}>
              <SidebarMenuButton
                tooltip={route.name}
                isActive={location.pathname === route.path}
                onClick={() => navigate(route.path)}
              >
                <route.icon className="h-5 w-5" />
                <span>{route.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="pb-4 px-2">
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default UnifiedSidebar;
