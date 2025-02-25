
import { useTranslation } from 'react-i18next';

interface CategoryTypeSelectorProps {
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  setSelectedType: (type: 'pharmacy' | 'parapharmacy' | null) => void;
}

export const CategoryTypeSelector = ({ selectedType, setSelectedType }: CategoryTypeSelectorProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-[600px] space-y-2 border-r pr-4 pb-4 w-[400px]">
      <div>
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
          className={`block w-full text-left px-3 py-2 rounded-md transition-colors mt-2 ${
            selectedType === 'parapharmacy' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
        >
          {t('common.navigation.parapharmacy')}
        </button>
      </div>
      
      {selectedType && (
        <div className="mt-auto">
          {selectedType === 'pharmacy' && (
            <img
              src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88"
              alt="Pharmacy"
              className="w-full h-64 object-cover rounded-md"
            />
          )}
          {selectedType === 'parapharmacy' && (
            <img
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae"
              alt="Parapharmacy"
              className="w-full h-64 object-cover rounded-md"
            />
          )}
        </div>
      )}
    </div>
  );
};
