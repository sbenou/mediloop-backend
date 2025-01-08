import { NavigationMenuList } from "@/components/ui/navigation-menu";
import { CategoriesNavigation } from "./CategoriesNavigation";
import { MainNavigationSection } from "./MainNavigationSection";
import { MoreSection } from "./MoreSection";

export const MainNavigation = () => {
  return (
    <NavigationMenuList className="hidden md:flex space-x-4">
      <CategoriesNavigation />
      <MainNavigationSection />
      <MoreSection />
    </NavigationMenuList>
  );
};