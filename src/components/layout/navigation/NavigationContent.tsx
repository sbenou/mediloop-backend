import { Link } from 'react-router-dom';
import { NavigationMenuContent } from "@/components/ui/navigation-menu";
import { CategoryContent } from './CategoryContent';

interface NavigationContentProps {
  selectedType: 'medication' | 'parapharmacy' | null;
  categories: any[];
  getFilteredCategories: (type: 'medication' | 'parapharmacy') => any[];
  getUniqueDescriptions: (subcategory: any) => string[];
}

export const NavigationContent = ({ 
  selectedType, 
  categories,
  getFilteredCategories,
  getUniqueDescriptions 
}: NavigationContentProps) => {
  return (
    <NavigationMenuContent>
      <div className="grid grid-cols-2 gap-4 p-4 w-[600px]">
        {/* Left side - Category Types */}
        <CategoryContent 
          selectedType={selectedType} 
          categories={categories}
          getFilteredCategories={getFilteredCategories}
          getUniqueDescriptions={getUniqueDescriptions}
        />

        {/* Bottom Links */}
        <div className="col-span-2 border-t pt-4 mt-4 space-y-2">
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
      </div>
    </NavigationMenuContent>
  );
};