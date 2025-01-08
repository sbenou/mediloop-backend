import { Link } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import { ArrowLeft, ShoppingCart, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { CartPreview } from '../CartPreview';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MainNavigation } from './navigation/MainNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  session: any;
  showUserMenu?: boolean;
  showBackLink?: boolean;
}

const Header = ({ session, showUserMenu = true, showBackLink = false }: HeaderProps) => {
  const { state: cartState } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
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
                  className={`${isHomePage ? 'h-16 sm:h-20' : 'h-12 sm:h-16'} transition-all duration-200`}
                />
              </Link>
            )}

            {isMobile ? (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-4">
                    <Link to="/products" className="block px-4 py-2 hover:bg-accent rounded-md">
                      Products
                    </Link>
                    <Link to="/services" className="block px-4 py-2 hover:bg-accent rounded-md">
                      Services
                    </Link>
                    <Link to="/become-partner" className="block px-4 py-2 hover:bg-accent rounded-md">
                      Become a Partner
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <NavigationMenu className="hidden md:block">
                <MainNavigation />
              </NavigationMenu>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="hidden md:inline-flex bg-[#4FD1C5] hover:bg-[#4FD1C5]/90 text-white"
            >
              <Link to="/products">Browse Medications</Link>
            </Button>
            {showUserMenu && (
              <>
                {session ? (
                  <UserMenu />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-primary hover:text-primary/80 transition-colors">
                      Connection
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to="/login?role=patient" className="w-full">
                          I am a patient
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/login?role=pharmacist" className="w-full">
                          I am a pharmacist
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/login?role=doctor" className="w-full">
                          I am a doctor
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/login?role=delivery" className="w-full">
                          I am a delivery man
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Shopping Cart</SheetTitle>
                    </SheetHeader>
                    <CartPreview onClose={() => setIsCartOpen(false)} session={session} />
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;