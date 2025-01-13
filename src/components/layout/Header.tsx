import { Link, useLocation } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MainNavigation } from './navigation/MainNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';
import MobileMenu from './navigation/MobileMenu';
import ConnectionMenu from './navigation/ConnectionMenu';
import CartButton from './navigation/CartButton';
import { useAuth } from '@/hooks/auth/useAuth';

interface HeaderProps {
  showUserMenu?: boolean;
  showBackLink?: boolean;
}

const Header = ({ showUserMenu = true, showBackLink = false }: HeaderProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // List of public routes that don't require authentication
  const publicRoutes = ['/', '/products', '/services', '/search-pharmacy', '/become-transporter', '/become-partner', '/login', '/signup', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-16">
            {showBackLink ? (
              <Link to="/" className="flex items-center text-primary hover:text-primary/80">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            ) : (
              <Link to="/">
                <img 
                  src="/lovable-uploads/1d4b50b5-2725-470b-a070-5227c3aa24b6.png" 
                  alt="LuxMed Logo" 
                  className={`${isHomePage ? 'h-14 sm:h-16' : 'h-12 sm:h-14'} transition-all duration-200`}
                />
              </Link>
            )}

            {isMobile ? (
              <MobileMenu 
                isOpen={isMobileMenuOpen}
                onOpenChange={setIsMobileMenuOpen}
              />
            ) : (
              <NavigationMenu className="hidden md:block">
                <NavigationMenuList>
                  <MainNavigation />
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector />
            {showUserMenu && (
              <>
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <ConnectionMenu />
                )}
                <CartButton 
                  isOpen={isCartOpen}
                  onOpenChange={setIsCartOpen}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;