import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Subcategory } from '@/components/product/types/product';
import { ChevronDown } from 'lucide-react';

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
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    console.log('Subcategory clicked:', { type: selectedType, categoryId, subcategoryId });
    navigate('/products');
    setTimeout(() => {
      const event = new CustomEvent('filterProducts', {
        detail: {
          type: selectedType,
          category: categoryId,
          subcategory: subcategoryId
        }
      });
      window.dispatchEvent(event);
      console.log('Filter event dispatched:', event);
    }, 100);
  };

  const toggleSubcategory = (subcategoryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

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
                  {category.subcategories?.map((subcategory: Subcategory) => (
                    <div key={subcategory.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                          className="text-sm font-medium hover:text-primary flex-grow text-left py-1"
                        >
                          {subcategory.name}
                        </button>
                        <button
                          onClick={(e) => toggleSubcategory(subcategory.id, e)}
                          className="p-1 hover:bg-accent rounded-md"
                        >
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform ${
                              expandedSubcategories[subcategory.id] ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                      {expandedSubcategories[subcategory.id] && (
                        <div className="pl-4 space-y-1">
                          {getUniqueDescriptions(subcategory).map((description, index) => (
                            <button
                              key={`${subcategory.id}-${index}`}
                              onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                              className="block w-full text-left text-xs text-muted-foreground hover:text-primary py-1"
                            >
                              {description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {!selectedType && (
                <div className="text-sm text-muted-foreground p-2">
                  Select a category type to view items
                </div>
              )}
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