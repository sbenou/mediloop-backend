
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import { ArrowLeft, User } from 'lucide-react';
import { useState, memo } from 'react';
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MainNavigation } from './navigation/MainNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';
import MobileMenu from './navigation/MobileMenu';
import CartButton from './navigation/CartButton';
import { useAuth } from '@/hooks/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationBell from '../NotificationBell';

interface UnifiedHeaderProps {
  showUserMenu?: boolean;
  showBackLink?: boolean;
  onBackClick?: () => void;
}

// Wrap userMenu in a memo component to prevent re-renders
const MemoizedUserMenu = memo(() => <UserMenu key="user-menu-component" />);
MemoizedUserMenu.displayName = 'MemoizedUserMenu';

// Wrap NotificationBell in a memo component to prevent re-renders
const MemoizedNotificationBell = memo(() => <NotificationBell key="notification-bell-component" />);
MemoizedNotificationBell.displayName = 'MemoizedNotificationBell';

// Wrap CartButton in a memo component to prevent re-renders
const MemoizedCartButton = memo(() => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  return (
    <CartButton 
      key="cart-button-component"
      isOpen={isCartOpen}
      onOpenChange={setIsCartOpen}
    />
  );
});
MemoizedCartButton.displayName = 'MemoizedCartButton';

// Wrap LanguageSelector in a memo component to prevent re-renders
const MemoizedLanguageSelector = memo(() => <LanguageSelector key="language-selector-component" />);
MemoizedLanguageSelector.displayName = 'MemoizedLanguageSelector';

const UnifiedHeader = ({ showUserMenu = true, showBackLink = false, onBackClick }: UnifiedHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, profile } = useAuth();

  const handleNavigateToLogin = () => {
    sessionStorage.removeItem('login_successful');
    sessionStorage.removeItem('skip_dashboard_redirect');
    navigate('/login', { replace: true });
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }
    if (profile?.role === 'superadmin') {
      navigate('/superadmin/dashboard');
    } else if (profile?.role === 'pharmacist') {
      navigate('/pharmacy/dashboard');
    } else {
      navigate('/');
    }
  };

  const publicRoutes = ['/', '/products', '/services', '/search-pharmacy', '/become-transporter', '/become-partner', '/login', '/signup', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  const LoadingSkeleton = () => (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-10 w-10 rounded-full">
        <div className="h-full w-full flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground/50" />
        </div>
      </Skeleton>
    </div>
  );

  return (
    <header className="bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-16">
            {showBackLink ? (
              <button 
                onClick={handleBackClick} 
                className="flex items-center text-primary hover:text-primary/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
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
            <MemoizedLanguageSelector />
            {showUserMenu && (
              <>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : isAuthenticated ? (
                  <>
                    <MemoizedNotificationBell />
                    <MemoizedUserMenu />
                  </>
                ) : (
                  <button
                    onClick={handleNavigateToLogin}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Connection
                  </button>
                )}
                <MemoizedCartButton />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Use memo to prevent the entire UnifiedHeader from re-rendering unnecessarily
export default memo(UnifiedHeader);
