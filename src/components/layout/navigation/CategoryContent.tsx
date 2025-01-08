import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

interface CategoryContentProps {
  selectedType: 'medication' | 'parapharmacy' | null;
  setSelectedType: (type: 'medication' | 'parapharmacy' | null) => void;
  categories: any[];
  getFilteredCategories: (type: 'medication' | 'parapharmacy') => any[];
  getUniqueDescriptions: (subcategory: any) => string[];
}

export const CategoryContent = ({ 
  selectedType,
  setSelectedType, 
  categories,
  getFilteredCategories,
  getUniqueDescriptions 
}: CategoryContentProps) => {
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  return (
    <>
      {/* Left side - Category Types */}
      <div className="space-y-2 border-r pr-4">
        <button
          onClick={() => setSelectedType('medication')}
          className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
            selectedType === 'medication' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
        >
          Pharmacy
        </button>
        <button
          onClick={() => setSelectedType('parapharmacy')}
          className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
            selectedType === 'parapharmacy' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
        >
          Parapharmacy
        </button>
      </div>

      {/* Right side - Subcategories and Descriptions */}
      <div className="space-y-4">
        {selectedType && getFilteredCategories(selectedType).map((category) => (
          <div key={category.id} className="space-y-2">
            {category.subcategories.map((subcategory: any) => (
              <div key={subcategory.id} className="space-y-1">
                <button
                  onClick={() => toggleSubcategory(subcategory.id)}
                  className="flex items-center justify-between w-full text-sm font-medium hover:text-primary"
                >
                  <span>{subcategory.name}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedSubcategories[subcategory.id] ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedSubcategories[subcategory.id] && (
                  <div className="pl-4 space-y-1">
                    {getUniqueDescriptions(subcategory).map((description: string, index: number) => (
                      <Link
                        key={`${subcategory.id}-${index}`}
                        to="/products"
                        className="block text-xs text-muted-foreground hover:text-primary"
                      >
                        {description}
                      </Link>
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
    </>
  );
};