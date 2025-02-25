
import { useTranslation } from 'react-i18next';

interface CategoryTypeSelectorProps {
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  setSelectedType: (type: 'pharmacy' | 'parapharmacy' | null) => void;
}

export const CategoryTypeSelector = ({ selectedType, setSelectedType }: CategoryTypeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
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

      {selectedType && (
        <div className="px-4 py-2">
          {selectedType === 'pharmacy' && (
            <img
              src="https://images.unsplash.com/photo-1618160702438-9b02ab6515c9"
              alt="Pharmacy"
              className="w-full h-32 object-cover rounded-md"
            />
          )}
          {selectedType === 'parapharmacy' && (
            <img
              src="https://images.unsplash.com/photo-1472396961693-142e6e269027"
              alt="Parapharmacy"
              className="w-full h-32 object-cover rounded-md"
            />
          )}
        </div>
      )}
    </div>
  );
};
