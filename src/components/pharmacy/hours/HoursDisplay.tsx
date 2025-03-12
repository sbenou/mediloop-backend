
import React from "react";
import { WeekHours } from "@/types/pharmacy/hours";
import { formatHoursDisplay } from "@/utils/pharmacy/hoursFormatters";

interface HoursDisplayProps {
  formattedHours: string[];
}

export const HoursDisplay: React.FC<HoursDisplayProps> = ({ formattedHours }) => {
  return (
    <div className="space-y-2 text-left">
      {formattedHours.map((line, index) => (
        <div key={index} className="text-sm text-left">
          {line}
        </div>
      ))}
    </div>
  );
};
