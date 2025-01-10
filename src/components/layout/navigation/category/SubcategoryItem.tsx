import { useTranslation } from 'react-i18next';

interface SubcategoryItemProps {
  subcategory: any;
  selectedType: 'medication' | 'parapharmacy' | null;
  categoryId: string;
  handleSubcategoryClick: (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => void;
  handleDescriptionClick: (type: string, categoryId: string, subcategoryId: string, event: React.MouseEvent) => void;
  getUniqueDescriptions?: (subcategory: any) => string[];
}

export const SubcategoryItem = ({ 
  subcategory,
  selectedType,
  categoryId,
  handleSubcategoryClick,
  handleDescriptionClick,
  getUniqueDescriptions
}: SubcategoryItemProps) => {
  const { t } = useTranslation();

  const getTranslationKey = (name: string) => {
    return name.toLowerCase().replace(/ /g, '_');
  };

  return (
    <div className="space-y-1">
      <a
        href="#"
        onClick={(e) => handleSubcategoryClick(selectedType!, categoryId, subcategory.id, e)}
        className="text-sm font-medium hover:text-primary hover:underline block w-full text-left py-1"
      >
        {t(`categories.${selectedType}.${getTranslationKey(subcategory.name)}`, { defaultValue: subcategory.name })}
      </a>
      <div className="pl-4 space-y-1">
        {getUniqueDescriptions && getUniqueDescriptions(subcategory).map((description: string, index: number) => (
          <a
            href="#"
            key={`${subcategory.id}-${index}`}
            onClick={(e) => handleDescriptionClick(selectedType!, categoryId, subcategory.id, e)}
            className="block w-full text-left text-xs text-muted-foreground hover:text-primary hover:underline py-1"
          >
            {t(`descriptions.${selectedType}.${getTranslationKey(description)}`, { defaultValue: description })}
          </a>
        ))}
      </div>
    </div>
  );
};