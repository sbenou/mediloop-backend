
import React from 'react';
import { WeekHours } from '@/types/pharmacy/hours';
import { formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';

interface DoctorHoursDisplayProps {
  hours: string | null;
  formattedHours: string[];
}

export const DoctorHoursDisplay: React.FC<DoctorHoursDisplayProps> = ({ 
  hours, 
  formattedHours 
}) => {
  const displayFormattedHours = () => {
    if (formattedHours.length === 0 && (!hours || hours.trim() === '')) {
      return (
        <div className="text-muted-foreground italic">
          No opening hours set. Click edit to add opening hours.
        </div>
      );
    }
    
    if (formattedHours.length > 0) {
      return (
        <div className="space-y-1">
          {formattedHours.map((line, index) => (
            <div key={index} className="text-sm flex">
              <span className="font-medium w-28 mr-6">{line.split(':')[0]}:</span>
              <span>{line.split(':').slice(1).join(':').trim()}</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback to showing the raw text
    const hoursLines = hours ? hours.split(/\r?\n/) : [];
    return (
      <div className="space-y-2">
        {hoursLines.map((line, index) => (
          <div key={index} className="text-sm">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {displayFormattedHours()}
    </div>
  );
};
