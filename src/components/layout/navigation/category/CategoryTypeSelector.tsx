
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryTypeSelectorProps {
  selectedType: 'pharmacy' | 'parapharmacy' | null;
  setSelectedType: (type: 'pharmacy' | 'parapharmacy' | null) => void;
}

export const CategoryTypeSelector = ({ selectedType, setSelectedType }: CategoryTypeSelectorProps) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Reset image loaded state when type changes
  useEffect(() => {
    if (selectedType) {
      setIsImageLoading(true);
      setImageLoaded(false);
      // Pre-load the image
      const img = new Image();
      img.src = selectedType === 'pharmacy' 
        ? "https://images.unsplash.com/photo-1587854692152-cbe660dbde88"
        : "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae";
      
      img.onload = () => {
        setTimeout(() => {
          setImageLoaded(true);
          setIsImageLoading(false);
        }, 300); // Small delay for smoother transition
      };
    } else {
      setIsImageLoading(false);
    }
  }, [selectedType]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsImageLoading(false);
  };

  const renderImage = () => {
    if (!selectedType) return null;

    const imageUrl = selectedType === 'pharmacy' 
      ? "https://images.unsplash.com/photo-1587854692152-cbe660dbde88"
      : "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae";

    return (
      <>
        {isImageLoading && <Skeleton className="w-full h-[200px] rounded-md absolute inset-0" />}
        <img
          src={imageUrl}
          alt={selectedType === 'pharmacy' ? "Pharmacy" : "Parapharmacy"}
          onLoad={handleImageLoad}
          className={`w-full h-auto max-h-full object-cover rounded-md transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
        />
      </>
    );
  };

  return (
    <div className="border-r pr-4 pb-4 w-[400px] h-[calc(100vh-4rem)] overflow-hidden">
      <div>
        <button
          onClick={() => {
            setImageLoaded(false);
            setIsImageLoading(true);
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
            setIsImageLoading(true);
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
        <div className="h-[calc(100%-80px)] overflow-hidden pt-4 relative">
          {renderImage()}
        </div>
      )}
    </div>
  );
};
