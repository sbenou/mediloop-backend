
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { CategoriesNavigation } from "./CategoriesNavigation";
import { MainNavigationSection } from "./MainNavigationSection";
import { MoreSection } from "./MoreSection";

export const MainNavigation = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="hidden md:flex space-x-4 justify-start">
        <CategoriesNavigation />
        <MainNavigationSection />
        <MoreSection />
      </NavigationMenuList>
    </NavigationMenu>
  );
};
