
import { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface ProductImageGalleryProps {
  mainImage?: string | null;
  galleryImages: string[];
  productName: string;
}

export const ProductImageGallery = ({ mainImage, galleryImages, productName }: ProductImageGalleryProps) => {
  const [activeImage, setActiveImage] = useState<string | null>(mainImage || galleryImages[0] || null);

  return (
    <div className="space-y-4">
      <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border">
        <img
          src={activeImage || '/placeholder.svg'}
          alt={productName || 'Product image'}
          className="h-full w-full object-contain"
        />
      </div>
      
      {galleryImages.length > 0 && (
        <div className="mb-24"> {/* Increased spacing from mb-16 to mb-24 for more space between carousel and navigation */}
          <Carousel className="w-full group relative">
            <CarouselContent>
              {galleryImages.map((image, index) => (
                <CarouselItem key={index} className="basis-1/4 sm:basis-1/5">
                  <div 
                    className={`h-20 w-full rounded-md overflow-hidden cursor-pointer border-2 
                      ${activeImage === image ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setActiveImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${productName || 'Product'} view ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 hidden group-hover:flex transition-all duration-300" />
            <CarouselNext className="right-0 hidden group-hover:flex transition-all duration-300" />
          </Carousel>
        </div>
      )}
    </div>
  );
};
