
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import NotificationBell from "../NotificationBell";
import UserMenu from "../UserMenu";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MainNavigation } from "./navigation/MainNavigation";
import CartButton from "./navigation/CartButton";
import { useAuth } from "@/hooks/auth/useAuth";

interface UnifiedHeaderProps {
  showBackLink?: boolean;
  onBackClick?: () => void;
  showUserMenu?: boolean;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  showBackLink = false,
  onBackClick,
  showUserMenu = true,
}) => {
  // Add state to control cart open/close
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };
  
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackLink ? (
            <button 
              onClick={handleBackClick} 
              className="flex items-center text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          ) : (
            <NavigationMenu>
              <NavigationMenuList>
                <MainNavigation />
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <CartButton 
            isOpen={isCartOpen}
            onOpenChange={setIsCartOpen}
          />
          {isAuthenticated && <NotificationBell />}
          {showUserMenu && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
