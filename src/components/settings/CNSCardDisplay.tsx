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
    <div className="relative w-full aspect-[1.586]">
      <div
        className={`w-full h-full transition-transform duration-700 relative preserve-3d cursor-pointer ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full backface-hidden"
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
          className="absolute w-full h-full backface-hidden rotate-y-180"
          style={{ backfaceVisibility: "hidden" }}
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