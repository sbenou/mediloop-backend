
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
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Home, Settings, FileText, Phone, Package, UserPlus, UserCircle, ShoppingCart, LayoutDashboard } from "lucide-react";
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
        section: "PLATFORM",
        items: [
          {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
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
            name: "Orders",
            path: "/my-orders",
            icon: ShoppingCart,
          },
        ],
      },
      {
        section: "ADMIN",
        items: [
          {
            name: "Settings",
            path: "/settings",
            icon: Settings,
          },
        ],
      },
    ];

    // If user is a pharmacist, add pharmacist-specific routes
    if (userRole === "pharmacist") {
      return [
        {
          section: "PLATFORM",
          items: [
            {
              name: "Dashboard",
              path: "/pharmacy",
              icon: LayoutDashboard,
            },
            {
              name: "Orders",
              path: "/pharmacy/orders",
              icon: ShoppingCart,
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
          ],
        },
        {
          section: "ADMIN",
          items: [
            {
              name: "Settings",
              path: "/pharmacy/settings",
              icon: Settings,
            },
          ],
        },
      ];
    }

    // If user is a superadmin, add admin-specific routes
    if (userRole === "superadmin") {
      return [
        {
          section: "PLATFORM",
          items: [
            {
              name: "Dashboard",
              path: "/superadmin",
              icon: LayoutDashboard,
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
          ],
        },
        {
          section: "ADMIN",
          items: [
            {
              name: "Settings",
              path: "/superadmin/settings",
              icon: Settings,
            },
          ],
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
        <div className="flex flex-col items-center">
          <img src="/logo.svg" alt="Mediloop" className="h-8" />
          <span className="text-xs font-medium mt-1">Mediloop</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {routes.map((section, index) => (
          <div key={index} className="mb-6">
            <SidebarGroupLabel className="px-2 mb-2">{section.section}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((route) => (
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
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="pb-4 px-2">
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
};

export default UnifiedSidebar;
