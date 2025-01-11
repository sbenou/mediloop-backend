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
    <div className="relative w-full aspect-[1.586] cursor-pointer" style={{ perspective: "1000px" }}>
      <div
        className="w-full h-full transition-transform duration-500 relative"
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of card */}
        <Card 
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          <img
            src="/lovable-uploads/a58aacba-6abd-441d-9672-d13a1af4ecad.png"
            alt="CNS Card Front"
            className="w-full h-full object-contain rounded-lg"
          />
        </Card>

        {/* Back of card */}
        <Card 
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <img
            src="/lovable-uploads/89c7246f-95c7-47ac-b1bd-56e5838289fc.png"
            alt="CNS Card Back"
            className="w-full h-full object-contain rounded-lg"
          />
        </Card>
      </div>
    </div>
  );
};

export default CNSCardDisplay;