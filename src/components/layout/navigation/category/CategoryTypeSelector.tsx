
import { useTranslation } from 'react-i18next';

interface CategoryTypeSelectorProps {
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  setSelectedType: (type: 'pharmacy' | 'parapharmacy' | null) => void;
}

export const CategoryTypeSelector = ({ selectedType, setSelectedType }: CategoryTypeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 border-r pr-4">
      <button
        onClick={() => setSelectedType(selectedType === 'pharmacy' ? null : 'pharmacy')}
        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
          selectedType === 'pharmacy' 
            ? 'bg-primary text-primary-foreground' 
            : 'hover:bg-accent'
        }`}
      >
        {t('common.navigation.pharmacy')}
      </button>
      <button
        onClick={() => setSelectedType(selectedType === 'parapharmacy' ? null : 'parapharmacy')}
        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
          selectedType === 'parapharmacy' 
            ? 'bg-primary text-primary-foreground' 
            : 'hover:bg-accent'
        }`}
      >
        {t('common.navigation.parapharmacy')}
      </button>
    </div>
  );
};
