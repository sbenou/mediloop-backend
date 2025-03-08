import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Home, User, ShoppingBag, Settings, Calendar, 
  Pill, Users, UserCircle, MapPin, Store, Heart,
  CreditCard
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarCollapsibleItem from "./SidebarCollapsibleItem";
import SidebarSubItem from "./SidebarSubItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

const UnifiedSidebar = () => {
  const { userRole, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isPharmacistSectionActive,
    isPharmacistTabActive,
    isLinkActive,
    navigateToLink
  } = useSidebarNavigation(userRole);
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);

  // Platform menu items
  const platformMenuItems = [
    {
      label: 'Dashboard',
      icon: <Home className="w-5 h-5 mr-3" />,
      path: '/dashboard',
      active: isLinkActive('/dashboard') && !location.search.includes('view=')
    }
  ];
  
  // Admin menu items
  const adminMenuItems = [
    {
      label: 'Settings',
      icon: <Settings className="w-5 h-5 mr-3" />,
      path: '/settings',
      active: isLinkActive('/settings') || isPharmacistSectionActive('settings')
    }
  ];

  // Orders subItems
  const ordersSubItems = [
    {
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=orders&ordersTab=orders',
      active: (location.pathname === '/dashboard' && 
              location.search.includes('view=orders') && 
              (!location.search.includes('ordersTab=') || location.search.includes('ordersTab=orders'))) ||
              isPharmacistTabActive('orders', 'ordersTab', 'orders')
    },
    {
      label: 'Payments',
      icon: <CreditCard className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=orders&ordersTab=payments',
      active: (location.pathname === '/dashboard' && 
              location.search.includes('view=orders') && 
              location.search.includes('ordersTab=payments')) ||
              isPharmacistTabActive('orders', 'ordersTab', 'payments')
    }
  ];
  
  // Profile subItems - filter out Pharmacy and My Doctor for pharmacist users
  const profileSubItems = [
    {
      label: 'Personal Details',
      icon: <UserCircle className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=personal',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=personal') ||
              isPharmacistTabActive('profile', 'profileTab', 'personal')
    },
    {
      label: 'Addresses',
      icon: <MapPin className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=addresses',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=addresses') ||
              isPharmacistTabActive('profile', 'profileTab', 'addresses')
    },
    {
      label: 'Next of Kin',
      icon: <Users className="w-4 h-4 mr-3" />,
      path: '/dashboard?view=profile&profileTab=nextofkin',
      active: location.search.includes('view=profile') && location.search.includes('profileTab=nextofkin') ||
              isPharmacistTabActive('profile', 'profileTab', 'nextofkin')
    }
  ];

  const filteredProfileSubItems = userRole === 'pharmacist' 
    ? profileSubItems.filter(item => !['Pharmacy', 'My Doctor'].includes(item.label)) 
    : profileSubItems;

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="Platform">
          {platformMenuItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              label={item.label}
              isActive={item.active || (userRole === 'pharmacist' && isPharmacistSectionActive('dashboard'))}
              onClick={() => navigateToLink(item.path)}
            />
          ))}
          
          {/* Profile section with special handling for pharmacists */}
          <SidebarCollapsibleItem 
            icon={<User className="w-5 h-5 mr-3" />}
            label="Profile"
            isOpen={isProfileOpen}
            isActive={location.search.includes('view=profile') || 
                     (userRole === 'pharmacist' && isPharmacistSectionActive('profile'))}
            onOpenChange={(isOpen) => setIsProfileOpen(isOpen)}
          >
            {filteredProfileSubItems.map((subItem, index) => (
              <SidebarSubItem
                key={index}
                icon={subItem.icon}
                label={subItem.label}
                isActive={subItem.active}
                onClick={() => navigateToLink(subItem.path)}
              />
            ))}
          </SidebarCollapsibleItem>
          
          {/* Orders section with special handling for pharmacists */}
          <SidebarCollapsibleItem 
            icon={<ShoppingBag className="w-5 h-5 mr-3" />}
            label="Orders"
            isOpen={isOrdersOpen}
            isActive={(location.pathname === '/dashboard' && location.search.includes('view=orders')) ||
                     (userRole === 'pharmacist' && isPharmacistSectionActive('orders')) ||
                     location.pathname.includes('/my-orders')}
            onOpenChange={(isOpen) => setIsOrdersOpen(isOpen)}
          >
            {ordersSubItems.map((subItem, index) => (
              <SidebarSubItem
                key={index}
                icon={subItem.icon}
                label={subItem.label}
                isActive={subItem.active}
                onClick={() => navigateToLink(subItem.path)}
              />
            ))}
          </SidebarCollapsibleItem>
          
          {(userRole === 'patient' || userRole === 'doctor' || userRole === 'pharmacist') && (
            <SidebarItem
              icon={<Pill className="w-5 h-5 mr-3" />}
              label="Prescriptions"
              isActive={(location.pathname === '/dashboard' && 
                        (location.search.includes('view=prescriptions') || 
                        (userRole === 'pharmacist' && isPharmacistSectionActive('prescriptions')))) ||
                        location.pathname.includes('/my-prescriptions')}
              onClick={() => navigateToLink(userRole === 'pharmacist' 
                ? '/dashboard?view=pharmacy&section=prescriptions' 
                : '/dashboard?view=prescriptions')}
            />
          )}
          
          {userRole === 'pharmacist' && (
            <SidebarItem
              icon={<Users className="w-5 h-5 mr-3" />}
              label="Patients"
              isActive={(location.pathname === '/dashboard' && 
                        location.search.includes('view=pharmacy') && 
                        location.search.includes('section=patients'))}
              onClick={() => navigateToLink('/dashboard?view=pharmacy&section=patients')}
            />
          )}
          
          {userRole !== 'pharmacist' && (
            <SidebarItem
              icon={<Calendar className="w-5 h-5 mr-3" />}
              label="Teleconsultations"
              isActive={(location.pathname === '/dashboard' && location.search.includes('view=teleconsultations')) ||
                        location.pathname.includes('/teleconsultations')}
              onClick={() => navigateToLink('/dashboard?view=teleconsultations')}
            />
          )}
        </SidebarSection>
        
        <SidebarSection title="Admin">
          {adminMenuItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              label={item.label}
              isActive={item.active}
              onClick={() => navigateToLink(item.path)}
            />
          ))}
        </SidebarSection>
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole={userRole}
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={() => {
          if (userRole === 'pharmacist') {
            navigateToLink('/dashboard?view=profile&profileTab=personal');
          } else {
            navigateToLink('/dashboard?view=profile&profileTab=personal');
          }
        }}
        navigateToBilling={() => {
          if (userRole === 'pharmacist') {
            navigateToLink('/dashboard?view=orders&ordersTab=payments');
          } else {
            navigateToLink('/dashboard?view=orders&ordersTab=payments');
          }
        }}
        navigateToUpgrade={() => navigate('/upgrade')}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default UnifiedSidebar;
