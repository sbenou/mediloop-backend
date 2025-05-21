
import React from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export const MainNavigationSection = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Navigation</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid gap-3 p-4 md:w-[400px] lg:grid-cols-2">
          <li>
            <Link 
              to="/products" 
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <div className="text-sm font-medium leading-none">Products</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                Browse our products
              </p>
            </Link>
          </li>
          <li>
            <Link 
              to="/services" 
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <div className="text-sm font-medium leading-none">Services</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                Discover our services
              </p>
            </Link>
          </li>
          <li className="lg:col-span-2">
            <Link 
              to="/become-partner" 
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <div className="text-sm font-medium leading-none">Become Partner</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                Join our network of partners
              </p>
            </Link>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
