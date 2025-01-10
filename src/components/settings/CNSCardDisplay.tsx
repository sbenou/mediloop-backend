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
    <div className="relative perspective-1000">
      <div
        className={`relative transition-transform duration-500 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card className="w-full aspect-[1.586] relative">
          <img
            src={frontImage}
            alt="CNS Card Front"
            className={`absolute w-full h-full object-cover rounded-lg shadow-lg transition-opacity duration-500 ${
              isFlipped ? "opacity-0" : "opacity-100"
            }`}
          />
          <img
            src={backImage}
            alt="CNS Card Back"
            className={`absolute w-full h-full object-cover rounded-lg shadow-lg rotate-y-180 transition-opacity duration-500 ${
              isFlipped ? "opacity-100" : "opacity-0"
            }`}
          />
        </Card>
      </div>
    </div>
  );
};

export default CNSCardDisplay;