
import { ReactNode } from "react";
import UnifiedSidebar from "../sidebar/UnifiedSidebar";
import NotificationBell from "../NotificationBell";
import UserMenu from "../UserMenu";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MainNavigation } from "./navigation/MainNavigation";
import CartButton from "./navigation/CartButton";
import UnifiedLayoutTemplate from "./UnifiedLayoutTemplate";

interface UnifiedLayoutProps {
  children: ReactNode;
}

const UnifiedLayout = ({ children }: UnifiedLayoutProps) => {
  // We're now just using UnifiedLayoutTemplate to ensure consistent layout
  return <UnifiedLayoutTemplate>{children}</UnifiedLayoutTemplate>;
};

export default UnifiedLayout;
