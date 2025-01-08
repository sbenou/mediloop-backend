import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const toggleSubcategory = (subcategoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  const handleSubcategoryClick = (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('Subcategory clicked:', { type, categoryId, subcategoryId });
    navigate('/products');
    const filterEvent = new CustomEvent('filterProducts', { 
      detail: { 
        type, 
        category: categoryId, 
        subcategory: subcategoryId 
      }
    });
    window.dispatchEvent(filterEvent);
    console.log('Filter event dispatched:', filterEvent);
  };

  const handleDescriptionClick = (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('Description clicked:', { type, categoryId, subcategoryId });
    navigate('/products');
    const filterEvent = new CustomEvent('filterProducts', { 
      detail: { 
        type, 
        category: categoryId, 
        subcategory: subcategoryId 
      }
    });
    window.dispatchEvent(filterEvent);
    console.log('Filter event dispatched:', filterEvent);
  };

  return (
    <>
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

      <div className="space-y-4">
        {selectedType && getFilteredCategories(selectedType).map((category) => (
          <div key={category.id} className="space-y-2">
            {category.subcategories.map((subcategory: any) => (
              <div key={subcategory.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href="#"
                    onClick={(e) => handleSubcategoryClick(selectedType, category.id, subcategory.id, e)}
                    className="text-sm font-medium hover:text-primary hover:underline flex-grow text-left py-1"
                  >
                    {subcategory.name}
                  </a>
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
                    {getUniqueDescriptions(subcategory).map((description: string, index: number) => (
                      <a
                        href="#"
                        key={`${subcategory.id}-${index}`}
                        onClick={(e) => handleDescriptionClick(selectedType, category.id, subcategory.id, e)}
                        className="block w-full text-left text-xs text-muted-foreground hover:text-primary hover:underline py-1"
                      >
                        {description}
                      </a>
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