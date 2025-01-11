import { useState } from "react";
import { Card } from "@/components/ui/card";

interface CNSCardDisplayProps {
  frontImage: string;
  backImage: string;
  cardNumber: string;
}

const CNSCardDisplay = ({ frontImage, backImage, cardNumber }: CNSCardDisplayProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Force the correct image paths
  const frontImagePath = "/lovable-uploads/CNS front.png";
  const backImagePath = "/lovable-uploads/CNS back.png";
  
  console.log('CNS Card Images:', { frontImagePath, backImagePath }); // Debug log

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
          <img
            src={frontImagePath}
            alt="CNS Card Front"
            className="w-full h-full object-contain rounded-lg"
          />
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
          <img
            src={backImagePath}
            alt="CNS Card Back"
            className="w-full h-full object-contain rounded-lg"
          />
        </Card>
      </div>
    </div>
  );
};

export default CNSCardDisplay;