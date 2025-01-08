import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { CartPreview } from '../CartPreview';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  session: any;
  showUserMenu?: boolean;
  showBackLink?: boolean;
}

const Header = ({ session, showUserMenu = true, showBackLink = false }: HeaderProps) => {
  const { state: cartState } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  
  const itemCount = cartState.items.reduce((acc, item) => acc + item.quantity, 0);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          type,
          subcategories (
            id,
            name
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleCategoryClick = (type: string) => {
    navigate('/products');
    // Add a small delay to ensure the Products component is mounted
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('filterProducts', { 
        detail: { type }
      }));
    }, 100);
  };

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
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Navigation</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <NavigationMenuLink asChild>
                        <Link 
                          to="/products"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Products</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Browse our products catalog
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link 
                          to="/services"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Services</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Discover our services
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link 
                          to="/become-partner"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">Become a Partner</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Join our network of partners
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[400px]">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Pharmacy</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => handleCategoryClick('medication')}
                              className="block w-full text-left text-sm text-muted-foreground hover:text-primary"
                            >
                              All Pharmacy Products
                            </button>
                            {categories?.filter(cat => cat.type === 'medication').map((category) => (
                              <div key={category.id} className="space-y-1">
                                {category.subcategories?.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleCategoryClick('medication')}
                                    className="block w-full text-left text-sm text-muted-foreground hover:text-primary pl-2"
                                  >
                                    {sub.name}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium">Parapharmacy</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => handleCategoryClick('parapharmacy')}
                              className="block w-full text-left text-sm text-muted-foreground hover:text-primary"
                            >
                              All Parapharmacy Products
                            </button>
                            {categories?.filter(cat => cat.type === 'parapharmacy').map((category) => (
                              <div key={category.id} className="space-y-1">
                                {category.subcategories?.map((sub) => (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleCategoryClick('parapharmacy')}
                                    className="block w-full text-left text-sm text-muted-foreground hover:text-primary pl-2"
                                  >
                                    {sub.name}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-3">
            {showUserMenu && (
              <>
                {session ? (
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
                        <CartPreview onClose={() => setIsCartOpen(false)} />
                      </SheetContent>
                    </Sheet>
                    <UserMenu />
                  </>
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