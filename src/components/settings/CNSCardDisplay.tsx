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
            src="/lovable-uploads/d2a0e334-8828-4c2a-8be5-a2eb901ab46d.png"
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
            src="/lovable-uploads/c13d24b0-a830-4efe-ae19-fbd705f33eaa.png"
            alt="CNS Card Back"
            className="w-full h-full object-contain rounded-lg"
          />
        </Card>
      </div>
    </div>
  );
};

export default CNSCardDisplay;