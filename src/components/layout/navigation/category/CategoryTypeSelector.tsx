
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface CategoryTypeSelectorProps {
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  setSelectedType: (type: 'pharmacy' | 'parapharmacy' | null) => void;
}

export const CategoryTypeSelector = ({ selectedType, setSelectedType }: CategoryTypeSelectorProps) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="flex flex-col border-r pr-4 w-[400px] h-[calc(100vh-4rem)] overflow-hidden">
      <div>
        <button
          onClick={() => {
            setImageLoaded(false);
            setSelectedType(selectedType === 'pharmacy' ? null : 'pharmacy');
          }}
          className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
            selectedType === 'pharmacy' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent'
          }`}
        >
          {t('common.navigation.pharmacy')}
        </button>
        <button
          onClick={() => {
            setImageLoaded(false);
            setSelectedType(selectedType === 'parapharmacy' ? null : 'parapharmacy');
          }}
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
        <div className="flex-grow flex items-end mt-4 overflow-hidden">
          {selectedType === 'pharmacy' && (
            <img
              src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88"
              alt="Pharmacy"
              onLoad={handleImageLoad}
              className={`w-full h-56 object-cover rounded-md transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          {selectedType === 'parapharmacy' && (
            <img
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae"
              alt="Parapharmacy"
              onLoad={handleImageLoad}
              className={`w-full h-56 object-cover rounded-md transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      )}
    </div>
  );
};
