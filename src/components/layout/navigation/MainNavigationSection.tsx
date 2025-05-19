
import React from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export const MainNavigationSection = () => {
  return (
    <NavigationMenuItem>
      <Link to="/products">
        <NavigationMenuLink
          className={cn(
            "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
          )}
        >
          Products
        </NavigationMenuLink>
      </Link>
    </NavigationMenuItem>
  );
};
