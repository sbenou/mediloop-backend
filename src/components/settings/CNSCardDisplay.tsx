import { useState } from "react";
import { Card } from "@/components/ui/card";

interface CNSCardDisplayProps {
  frontImage: string;
  backImage: string;
  cardNumber: string;
}

const CNSCardDisplay = ({ frontImage, backImage, cardNumber }: CNSCardDisplayProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full aspect-[1.586]" 
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <Card 
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute"
          }}
        >
          <img
            src={frontImage}
            alt="CNS Card Front"
            className="w-full h-full object-cover rounded-lg"
          />
        </Card>

        {/* Back of card */}
        <Card 
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            position: "absolute",
            transform: "rotateY(180deg)"
          }}
        >
          <img
            src={backImage}
            alt="CNS Card Back"
            className="w-full h-full object-cover rounded-lg"
          />
        </Card>
      </div>
    </div>
  );
};

export default CNSCardDisplay;