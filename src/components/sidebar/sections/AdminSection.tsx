
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";
import { adminMenuItems } from "../config/sidebarNavItems";
import { useSidebarNavigation } from "@/hooks/sidebar/useSidebarNavigation";
import { useSidebarItems } from "../hooks/useSidebarItems";

export const AdminSection = () => {
  const { navigateToLink } = useSidebarNavigation();
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

