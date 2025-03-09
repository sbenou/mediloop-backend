
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface SubcategoryItemProps {
  subcategory: any;
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  categoryId: string;
  handleSubcategoryClick: (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => void;
  handleDescriptionClick: (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => void;
  getUniqueDescriptions?: (subcategory: any) => string[];
  animationDelay?: number;
  isVisible?: boolean;
}

export const SubcategoryItem = ({ 
  subcategory,
  selectedType,
  categoryId,
  handleSubcategoryClick,
  handleDescriptionClick,
  getUniqueDescriptions,
  animationDelay = 0,
  isVisible = true
}: SubcategoryItemProps) => {
  const { t } = useTranslation();
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(false);
  const [isSubcategoryVisible, setIsSubcategoryVisible] = useState(false);

  useEffect(() => {
    if (subcategory && getUniqueDescriptions) {
      setIsLoadingDescriptions(true);
      // Simulate async loading with a small delay
      const timer = setTimeout(() => {
        setDescriptions(getUniqueDescriptions(subcategory));
        setIsLoadingDescriptions(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [subcategory, getUniqueDescriptions]);

  useEffect(() => {
    // Only start the subcategory animation after the parent category is visible
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsSubcategoryVisible(true);
      }, animationDelay);
      
      return () => clearTimeout(timer);
    } else {
      setIsSubcategoryVisible(false);
    }
  }, [isVisible, animationDelay]);

  if (!subcategory) {
    console.log('No subcategory data provided');
    return null;
  }

  console.log('Rendering subcategory:', subcategory.name);

  const getTranslationKey = (name: string) => {
    return name.toLowerCase().replace(/ /g, '_');
  };

  return (
    <div className={`space-y-1 transition-all duration-300 ${isSubcategoryVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <a
        href="#"
        onClick={(e) => handleSubcategoryClick(selectedType!, categoryId, subcategory.id, e)}
        className="text-sm hover:text-primary hover:underline block w-full text-left px-3 py-1"
      >
        {t(`categories.${selectedType}.${getTranslationKey(subcategory.name)}`, { defaultValue: subcategory.name })}
      </a>
      {getUniqueDescriptions && (
        <div className="pl-4 space-y-1">
          {isLoadingDescriptions ? (
            // Show skeleton loaders while descriptions are loading
            [1, 2].map((index) => (
              <Skeleton 
                key={`skeleton-${subcategory.id}-${index}`} 
                className="h-3 w-4/5 rounded-md my-1 ml-3" 
              />
            ))
          ) : (
            descriptions.map((description: string, index: number) => (
              <a
                href="#"
                key={`${subcategory.id}-${index}`}
                onClick={(e) => handleDescriptionClick(selectedType!, categoryId, subcategory.id, e)}
                className={`block w-full text-left text-xs text-muted-foreground hover:text-primary hover:underline px-3 py-1 transition-all duration-300 ${
                  isSubcategoryVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {t(`descriptions.${selectedType}.${getTranslationKey(description)}`, { defaultValue: description })}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
};
