
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
        <div className="p-4 w-[220px]">
          <ul className="flex flex-col space-y-2">
            <li>
              <Link 
                to="/products" 
                className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
              >
                <div className="text-sm font-medium leading-none">Products</div>
                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground mt-1 text-left">
                  Browse our products
                </p>
              </Link>
            </li>
            <li>
              <Link 
                to="/services" 
                className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
              >
                <div className="text-sm font-medium leading-none">Services</div>
                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground mt-1 text-left">
                  Discover our services
                </p>
              </Link>
            </li>
            <li>
              <Link 
                to="/become-partner" 
                className="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left"
              >
                <div className="text-sm font-medium leading-none">Become Partner</div>
                <p className="line-clamp-2 text-xs leading-snug text-muted-foreground mt-1 text-left">
                  Join our network of partners
                </p>
              </Link>
            </li>
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
