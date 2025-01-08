import { Subcategory } from '@/components/product/types/product';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SubcategoryListProps {
  subcategories: Subcategory[];
  onCategoryClick: (type: string) => void;
  type: 'medication' | 'parapharmacy';
}

export const SubcategoryList = ({ subcategories, onCategoryClick, type }: SubcategoryListProps) => {
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  const getUniqueDescriptions = (subcategory: Subcategory) => {
    if (!subcategory.products) {
      console.log('No products found for subcategory:', subcategory.name);
      return [];
    }
    
    console.log('Products for subcategory:', subcategory.name, subcategory.products);
    
    const descriptions = subcategory.products
      .filter(product => product && typeof product.description === 'string' && product.description.trim() !== '')
      .map(product => product.description);
    
    const uniqueDescriptions = [...new Set(descriptions)];
    console.log('Unique descriptions for subcategory:', subcategory.name, uniqueDescriptions);
    return uniqueDescriptions;
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  return (
    <div className="space-y-1">
      {subcategories.map((sub) => (
        <div key={sub.id} className="space-y-1">
          <button
            onClick={() => toggleSubcategory(sub.id)}
            className="flex items-center justify-between w-full text-left text-sm text-muted-foreground hover:text-primary pl-2 py-1"
          >
            <span>{sub.name}</span>
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${
                expandedSubcategories[sub.id] ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          
          {expandedSubcategories[sub.id] && (
            <div className="pl-4 space-y-1">
              {getUniqueDescriptions(sub).map((description, index) => (
                <button
                  key={`${sub.id}-${index}`}
                  onClick={() => onCategoryClick(type)}
                  className="block w-full text-left text-xs text-muted-foreground hover:text-primary pl-2 py-0.5"
                >
                  {description}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};