import { LucideIcon } from "lucide-react";

interface DeliveryFeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  isReversed?: boolean;
  animationDelay: number;
  inView: boolean;
}

export const DeliveryFeature = ({
  icon: Icon,
  title,
  description,
  image,
  isReversed = false,
  animationDelay,
  inView
}: DeliveryFeatureProps) => {
  const ContentSection = () => (
    <div className="flex-1">
      <div className="flex items-start">
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          <Icon className="h-7 w-7 text-[#7E69AB]" />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  const ImageSection = () => (
    <div className="flex-1">
      <img 
        src={image} 
        alt={title}
        className="w-full h-auto max-w-[200px] mx-auto"
        loading="lazy"
      />
    </div>
  );

  return (
    <div 
      className={`flex items-center gap-8 ${
        inView ? 'animate-fade-in opacity-100' : 'opacity-0'
      }`}
      style={{
        animationDelay: `${animationDelay}ms`
      }}
    >
      {isReversed ? (
        <>
          <ImageSection />
          <ContentSection />
        </>
      ) : (
        <>
          <ContentSection />
          <ImageSection />
        </>
      )}
    </div>
  );
};