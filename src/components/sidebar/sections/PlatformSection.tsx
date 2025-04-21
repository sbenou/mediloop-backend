
import { Pill, HeartPulse, User, ShoppingBag } from "lucide-react";
import SidebarSection from "../SidebarSection";
import SidebarItem from "../SidebarItem";
import SidebarCollapsibleItem from "../SidebarCollapsibleItem";
import SidebarSubItem from "../SidebarSubItem";
import { platformMenuItems, ordersSubItems, consultationsSubItems } from "../config/sidebarNavItems";
import { useSidebarNavigation } from "@/hooks/sidebar/useSidebarNavigation";
import { useSidebarItems } from "../hooks/useSidebarItems";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation } from "react-router-dom";

export const PlatformSection = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isConsultationsOpen,
    setIsConsultationsOpen,
    navigateToLink,
    isPharmacistSectionActive
  } = useSidebarNavigation(userRole);

  const { 
    getFilteredProfileSubItems, 
    showConsultationsMenu, 
    showPrescriptionsMenu,
    isLinkActive 
  } = useSidebarItems();

  const filteredProfileSubItems = getFilteredProfileSubItems();
  console.log("Filtered Profile SubItems:", filteredProfileSubItems);

  return (
    <SidebarSection title="Platform">
      {platformMenuItems.map((item, index) => (
        <SidebarItem
          key={index}
          icon={item.icon}
          label={item.label}
          isActive={isLinkActive(item.path)}
          onClick={() => navigateToLink(item.path)}
        />
      ))}

      <SidebarCollapsibleItem
        icon={<User className="w-5 h-5 mr-3" />}
        label="Profile"
        isOpen={isProfileOpen}
        isActive={location.search.includes('view=profile') || location.search.includes('section=profile')}
        onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
      >
        {filteredProfileSubItems.map((subItem, index) => {
          // For doctor role, adjust paths to use section instead of view
          const path = userRole === 'doctor' 
            ? subItem.path.replace('view=profile', 'section=profile') 
            : subItem.path;
            
          return (
            <SidebarSubItem
              key={index}
              icon={subItem.icon}
              label={subItem.label}
              isActive={
                (location.search.includes('profileTab=' + path.split('profileTab=')[1])) &&
                (location.search.includes('view=profile') || location.search.includes('section=profile'))
              }
              onClick={() => navigateToLink(path)}
            />
          );
        })}
      </SidebarCollapsibleItem>

      <SidebarCollapsibleItem
        icon={<ShoppingBag className="w-5 h-5 mr-3" />}
        label="Orders"
        isOpen={isOrdersOpen}
        isActive={location.search.includes('view=orders')}
        onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
      >
        {ordersSubItems.map((subItem, index) => (
          <SidebarSubItem
            key={index}
            icon={subItem.icon}
            label={subItem.label}
            isActive={location.search.includes('ordersTab=' + subItem.path.split('ordersTab=')[1])}
            onClick={() => navigateToLink(subItem.path)}
          />
        ))}
      </SidebarCollapsibleItem>

      {showPrescriptionsMenu && (
        <SidebarItem
          icon={<Pill className="w-5 h-5 mr-3" />}
          label="Prescriptions"
          isActive={location.search.includes('view=prescriptions') || location.search.includes('section=prescriptions')}
          onClick={() => {
            const path = userRole === 'doctor' 
              ? '/dashboard?section=prescriptions' 
              : '/dashboard?view=prescriptions';
            navigateToLink(path);
          }}
        />
      )}

      {showConsultationsMenu && (
        <SidebarCollapsibleItem
          icon={<HeartPulse className="w-5 h-5 mr-3" />}
          label="Consultations"
          isOpen={isConsultationsOpen}
          isActive={location.search.includes('view=teleconsultations') || 
                   location.search.includes('view=appointments') ||
                   location.search.includes('section=teleconsultations') ||
                   location.search.includes('section=appointments')}
          onOpenChange={(isOpen) => setIsConsultationsOpen(isOpen)}
        >
          {consultationsSubItems.map((subItem, index) => {
            // For doctor role, adjust paths to use section instead of view
            const path = userRole === 'doctor'
              ? subItem.path.replace('view=', 'section=')
              : subItem.path;
              
            return (
              <SidebarSubItem
                key={index}
                icon={subItem.icon}
                label={subItem.label}
                isActive={
                  location.search.includes('view=' + subItem.path.split('view=')[1]) ||
                  location.search.includes('section=' + path.split('section=')[1])
                }
                onClick={() => navigateToLink(path)}
              />
            );
          })}
        </SidebarCollapsibleItem>
      )}
    </SidebarSection>
  );
};
