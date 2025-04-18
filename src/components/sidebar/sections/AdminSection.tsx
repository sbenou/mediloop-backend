
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";
import { adminMenuItems } from "../config/sidebarNavItems";
import { useSidebarNavigation } from "@/hooks/sidebar/useSidebarNavigation";
import { useSidebarItems } from "../hooks/useSidebarItems";
import { useAuth } from "@/hooks/auth/useAuth";

export const AdminSection = () => {
  const { userRole } = useAuth();
  const { navigateToLink } = useSidebarNavigation(userRole);
  const { isLinkActive } = useSidebarItems();

  return (
    <SidebarSection title="Admin">
      {adminMenuItems.map((item, index) => (
        <SidebarItem
          key={index}
          icon={item.icon}
          label={item.label}
          isActive={isLinkActive(item.path)}
          onClick={() => navigateToLink(item.path)}
        />
      ))}
    </SidebarSection>
  );
};
