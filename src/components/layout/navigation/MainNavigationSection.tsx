import { Link } from 'react-router-dom';
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";

export const MainNavigationSection = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Navigation</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[400px] gap-3 p-4">
          <Link 
            to="/products"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">Products</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              Browse our products catalog
            </p>
          </Link>
          <Link 
            to="/services"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">Services</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              Discover our services
            </p>
          </Link>
          <Link 
            to="/become-partner"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">Become a Partner</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              Join our network of partners
            </p>
          </Link>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};