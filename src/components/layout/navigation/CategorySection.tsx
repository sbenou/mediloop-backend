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
  getUniqueDescriptions?: (subcategory: any) => string[];
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
  const navigate = useNavigate();

  const handleSubcategoryClick = (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Subcategory clicked:', { type, categoryId, subcategoryId });
    navigate('/products');
    setTimeout(() => {
      const filterEvent = new CustomEvent('filterProducts', { 
        detail: { 
          type, 
          category: categoryId, 
          subcategory: subcategoryId 
        }
      });
      window.dispatchEvent(filterEvent);
      console.log('Filter event dispatched:', filterEvent);
    }, 100);
  };

  const handleDescriptionClick = (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Description clicked:', { type, categoryId, subcategoryId });
    navigate('/products');
    setTimeout(() => {
      const filterEvent = new CustomEvent('filterProducts', { 
        detail: { 
          type, 
          category: categoryId, 
          subcategory: subcategoryId 
        }
      });
      window.dispatchEvent(filterEvent);
      console.log('Filter event dispatched:', filterEvent);
    }, 100);
  };

  if (getFilteredCategories && getUniqueDescriptions) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger>Medications</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid grid-cols-2 gap-4 p-4 w-[600px]">
            <div className="space-y-4">
              <button
                onClick={() => setSelectedType('medication')}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedType === 'medication' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Pharmacy
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
                  {category.subcategories?.map((subcategory: Subcategory) => (
                    <div key={subcategory.id} className="ml-4 space-y-1">
                      <a
                        href="#"
                        onClick={(e) => handleSubcategoryClick(selectedType, category.id, subcategory.id, e)}
                        className="text-sm font-medium hover:text-primary hover:underline cursor-pointer block w-full text-left py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2"
                      >
                        {subcategory.name}
                      </a>
                      <div className="ml-4 text-sm text-muted-foreground">
                        {getUniqueDescriptions(subcategory).map((description, index) => (
                          <a
                            href="#"
                            key={`${subcategory.id}-${index}`}
                            onClick={(e) => handleDescriptionClick(selectedType, category.id, subcategory.id, e)}
                            className="block w-full text-left text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer py-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2"
                          >
                            {description}
                          </a>
                        ))}
                      </div>
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