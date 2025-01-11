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
    <div className="relative w-full aspect-[1.586]" style={{ perspective: "1000px" }}>
      <div
        className={`w-full h-full transition-all duration-500 cursor-pointer relative`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ 
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="w-full h-full">
            <img
              src={frontImage}
              alt="CNS Card Front"
              className="w-full h-full object-cover rounded-lg"
            />
          </Card>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <Card className="w-full h-full">
            <img
              src={backImage}
              alt="CNS Card Back"
              className="w-full h-full object-cover rounded-lg"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CNSCardDisplay;