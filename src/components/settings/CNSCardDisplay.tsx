import { useState } from "react";
import { Card } from "@/components/ui/card";

interface CNSCardDisplayProps {
  frontImage: string;
  backImage: string;
  cardNumber: string;
}

const CNSCardDisplay = ({ frontImage, backImage, cardNumber }: CNSCardDisplayProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  console.log('CNS Card Display - Image paths:', { 
    frontImage,
    backImage,
    absoluteFrontPath: frontImage.startsWith('/') ? frontImage : `/${frontImage}`,
    absoluteBackPath: backImage.startsWith('/') ? backImage : `/${backImage}`
  }); // Debug log

  return (
    <div className="relative w-[300px] aspect-[1.586] cursor-pointer" style={{ perspective: "1000px" }}>
      <div
        className="absolute w-full h-full transition-transform duration-500"
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <Card 
          className="absolute w-full h-full"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          <div className="w-full h-full">
            <img
              src={frontImage}
              alt="CNS Card Front"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Error loading front image:', frontImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </Card>

        {/* Back of card */}
        <Card 
          className="absolute w-full h-full"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="w-full h-full">
            <img
              src={backImage}
              alt="CNS Card Back"
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Error loading back image:', backImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CNSCardDisplay;