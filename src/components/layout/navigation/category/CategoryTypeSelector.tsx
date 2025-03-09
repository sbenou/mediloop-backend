
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Triangle } from "lucide-react";

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
    <div className="border-r pr-4 pb-4 w-[400px] h-[calc(100vh-4rem)] overflow-hidden relative">
      <div>
        <div className="flex items-center relative">
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
          {selectedType === 'pharmacy' && (
            <div className="absolute right-[-10px] z-10 flex items-center justify-center h-full pointer-events-none">
              <div className="relative h-5 w-5 rotate-180">
                <Triangle className="h-5 w-5 text-white absolute top-0 left-0" />
                <Triangle className="h-5 w-5 text-primary stroke-[3] fill-none absolute top-0 left-0" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center mt-2 relative">
          <button
            onClick={() => {
              setImageLoaded(false);
              setIsImageLoading(true);
              setSelectedType(selectedType === 'parapharmacy' ? null : 'parapharmacy');
            }}
            className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedType === 'parapharmacy' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-accent'
            }`}
          >
            {t('common.navigation.parapharmacy')}
          </button>
          {selectedType === 'parapharmacy' && (
            <div className="absolute right-[-10px] z-10 flex items-center justify-center h-full pointer-events-none">
              <div className="relative h-5 w-5 rotate-180">
                <Triangle className="h-5 w-5 text-white absolute top-0 left-0" />
                <Triangle className="h-5 w-5 text-primary stroke-[3] fill-none absolute top-0 left-0" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {selectedType && (
        <div className="h-[calc(100%-80px)] overflow-hidden pt-4 relative">
          {renderImage()}
        </div>
      )}
    </div>
  );
};
