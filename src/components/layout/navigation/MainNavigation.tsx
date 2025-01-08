import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const MainNavigation = () => {
  return (
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
    </NavigationMenuList>
  );
};