
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

  useEffect(() => {
    if (selectedType) {
      setIsLoading(true);
      // Simulate async loading with a small delay
      const timer = setTimeout(() => {
        setFilteredCategories(getUniqueCategories(categories, selectedType));
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setFilteredCategories([]);
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
          return (
            <div key={category.id} className="space-y-2">
              <h3 className="font-medium text-sm px-3 py-2">
                {t(`categories.${selectedType}.${category.name.toLowerCase().replace(/ /g, '_')}`, { defaultValue: category.name })}
              </h3>
              <div className="pl-4 space-y-1">
                {Array.isArray(category.subcategories) && category.subcategories.map((subcategory: any) => (
                  <SubcategoryItem
                    key={subcategory.id}
                    subcategory={subcategory}
                    selectedType={selectedType}
                    categoryId={category.id}
                    handleSubcategoryClick={handleSubcategoryClick}
                    handleDescriptionClick={handleDescriptionClick}
                    getUniqueDescriptions={getUniqueDescriptions}
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
