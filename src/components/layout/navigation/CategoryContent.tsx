
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CategoryTypeSelector } from './category/CategoryTypeSelector';
import { CategoryList } from './category/CategoryList';

interface CategoryContentProps {
  categories: any[];
  getUniqueCategories: (categories: any[], type: string) => any[];
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  setSelectedType: (type: 'pharmacy' | 'parapharmacy' | null) => void;
  getFilteredCategories?: (type: 'pharmacy' | 'parapharmacy') => any[];
  getUniqueDescriptions?: (subcategory: any) => string[];
}

export const CategoryContent = ({ 
  categories,
  getUniqueCategories,
  selectedType,
  setSelectedType,
  getUniqueDescriptions
}: CategoryContentProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  return (
    <>
      <CategoryTypeSelector 
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />
      <CategoryList
        selectedType={selectedType}
        categories={categories}
        getUniqueCategories={getUniqueCategories}
        handleSubcategoryClick={handleSubcategoryClick}
        handleDescriptionClick={handleDescriptionClick}
        getUniqueDescriptions={getUniqueDescriptions}
      />
    </>
  );
};
