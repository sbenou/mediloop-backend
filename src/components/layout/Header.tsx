import { Link } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
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
import { CategoriesNavigation } from './navigation/CategoriesNavigation';

interface HeaderProps {
  session: any;
  showUserMenu?: boolean;
  showBackLink?: boolean;
}

const Header = ({ session, showUserMenu = true, showBackLink = false }: HeaderProps) => {
  const { state: cartState } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
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
                  className="h-16"
                />
              </Link>
            )}

            <NavigationMenu>
              <MainNavigation />
              <CategoriesNavigation />
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-3">
            {showUserMenu && (
              <>
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
                {session ? (
                  <UserMenu />
                ) : (
                  <Link 
                    to="/login" 
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Connection
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;