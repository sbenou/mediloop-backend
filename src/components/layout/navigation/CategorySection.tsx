import { useState } from 'react';
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Subcategory } from '@/components/product/types/product';

interface CategorySectionProps {
  title: string;
  categories: any[];
  type: string;
  onCategoryClick: (type: string) => void;
  getFilteredCategories?: (type: 'medication' | 'parapharmacy') => any[];
  getUniqueDescriptions?: (subcategory: Subcategory) => string[];
}

export const CategorySection = ({ 
  title,
  categories,
  type,
  onCategoryClick,
  getFilteredCategories,
  getUniqueDescriptions 
}: CategorySectionProps) => {
  const [selectedType, setSelectedType] = useState<'medication' | 'parapharmacy' | null>(null);

  if (getFilteredCategories && getUniqueDescriptions) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid grid-cols-2 gap-4 p-4 w-[600px]">
            <div className="space-y-4">
              <button
                onClick={() => setSelectedType('medication')}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedType === 'medication' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Medication
              </button>
              <button
                onClick={() => setSelectedType('parapharmacy')}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedType === 'parapharmacy' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Parapharmacy
              </button>
            </div>

            <div className="space-y-4">
              {selectedType && getFilteredCategories(selectedType).map((category) => (
                <div key={category.id} className="space-y-2">
                  <h3 className="font-medium">{category.name}</h3>
                  {category.subcategories?.map((subcategory) => (
                    <div key={subcategory.id} className="ml-4 space-y-1">
                      <h4 className="text-sm font-medium">{subcategory.name}</h4>
                      <div className="ml-4 text-sm text-muted-foreground">
                        {getUniqueDescriptions(subcategory as Subcategory).map((description, index) => (
                          <p key={index} className="line-clamp-2">{description}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(type)}
            className="block w-full text-left text-sm hover:text-primary"
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};