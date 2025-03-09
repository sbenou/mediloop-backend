
import { useTranslation } from 'react-i18next';
import { SubcategoryItem } from './SubcategoryItem';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from 'react';

interface CategoryListProps {
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  categories: any[];
  getUniqueCategories: (categories: any[], type: string) => any[];
  handleSubcategoryClick: (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => void;
  handleDescriptionClick: (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => void;
  getUniqueDescriptions?: (subcategory: any) => string[];
}

export const CategoryList = ({
  selectedType,
  categories,
  getUniqueCategories,
  handleSubcategoryClick,
  handleDescriptionClick,
  getUniqueDescriptions
}: CategoryListProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);

  useEffect(() => {
    if (selectedType) {
      setIsLoading(true);
      setVisibleCategories([]);
      
      // Simulate async loading with a small delay
      const timer = setTimeout(() => {
        const filtered = getUniqueCategories(categories, selectedType);
        setFilteredCategories(filtered);
        setIsLoading(false);
        
        // Start the sequential animation for categories
        if (filtered.length > 0) {
          const showCategoriesSequentially = async () => {
            for (let i = 0; i < filtered.length; i++) {
              // Add a small delay before showing each category
              await new Promise(resolve => setTimeout(resolve, 100));
              setVisibleCategories(prev => [...prev, filtered[i].id]);
            }
          };
          
          showCategoriesSequentially();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setFilteredCategories([]);
      setVisibleCategories([]);
      setIsLoading(false);
    }
  }, [selectedType, categories, getUniqueCategories]);

  if (!selectedType) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        {t('common.navigation.selectCategory', 'Select a category')}
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeletons />;
  }

  if (!filteredCategories || filteredCategories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        {t('common.navigation.noCategoriesFound', 'No categories found')}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 pr-4">
        {filteredCategories.map((category) => {
          console.log('Category:', category.name, 'Subcategories:', category.subcategories);
          const isVisible = visibleCategories.includes(category.id);
          
          return (
            <div 
              key={category.id} 
              className={`space-y-2 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              <h3 className="font-medium text-sm px-3 py-2">
                {t(`categories.${selectedType}.${category.name.toLowerCase().replace(/ /g, '_')}`, { defaultValue: category.name })}
              </h3>
              <div className="pl-4 space-y-1">
                {Array.isArray(category.subcategories) && category.subcategories.map((subcategory: any, index: number) => (
                  <SubcategoryItem
                    key={subcategory.id}
                    subcategory={subcategory}
                    selectedType={selectedType}
                    categoryId={category.id}
                    handleSubcategoryClick={handleSubcategoryClick}
                    handleDescriptionClick={handleDescriptionClick}
                    getUniqueDescriptions={getUniqueDescriptions}
                    animationDelay={index * 50} // Add a delay based on the index
                    isVisible={isVisible}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// Loading skeleton component for categories and subcategories
const LoadingSkeletons = () => {
  return (
    <div className="space-y-4 pr-4 p-2">
      {[1, 2, 3].map((index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-6 w-4/5 rounded-md mb-2" />
          <div className="pl-4 space-y-2">
            {[1, 2, 3].map((subIndex) => (
              <Skeleton 
                key={`${index}-${subIndex}`} 
                className="h-4 w-3/4 rounded-md" 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
