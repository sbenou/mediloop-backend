
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { CategoryContent } from "./CategoryContent";

export const CategoriesNavigation = () => {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Medications</NavigationMenuTrigger>
      <NavigationMenuContent>
        <CategoryContent 
          categories={[]}
          getUniqueCategories={() => []}
          selectedType={null}
          setSelectedType={() => {}}
        />
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
