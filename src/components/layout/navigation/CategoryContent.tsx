import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CategoryContentProps {
  categories: any[];
  getUniqueCategories: (categories: any[], type: string) => any[];
}

export const CategoryContent = ({ 
  categories,
  getUniqueCategories,
}: CategoryContentProps) => {
  const [selectedType, setSelectedType] = useState<'medication' | 'parapharmacy' | null>(null);
  const navigate = useNavigate();

  const handleSubcategoryClick = (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => {
    event.preventDefault();
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

  const getUniqueDescriptions = (subcategory: any) => {
    if (!subcategory.products) return [];
    const descriptions = subcategory.products
      .filter((product: any) => product && typeof product.description === 'string' && product.description.trim() !== '')
      .map((product: any) => product.description);
    return [...new Set(descriptions)];
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
        {selectedType && getUniqueCategories(categories, selectedType).map((category) => (
          <div key={category.id} className="space-y-2">
            {category.subcategories?.map((subcategory: any) => (
              <div key={subcategory.id} className="space-y-1">
                <a
                  href="#"
                  onClick={(e) => handleSubcategoryClick(selectedType, category.id, subcategory.id, e)}
                  className="text-sm font-medium hover:text-primary hover:underline block w-full text-left py-1"
                >
                  {subcategory.name}
                </a>
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