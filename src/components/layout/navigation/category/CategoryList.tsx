
import { useTranslation } from 'react-i18next';
import { SubcategoryItem } from './SubcategoryItem';
import { ScrollArea } from "@/components/ui/scroll-area";

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

  if (!selectedType) {
    return (
      <div className="text-sm text-muted-foreground p-2">
        {t('common.navigation.selectCategory', 'Select a category')}
      </div>
    );
  }

  const filteredCategories = getUniqueCategories(categories, selectedType);
  console.log('Filtered categories:', filteredCategories);

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
