
import React from 'react';

interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => {
  return (
    <div className="flex items-center">
      <div className={`w-4 h-4 ${color} rounded mr-1`}></div>
      <span className="text-xs">{label}</span>
    </div>
  );
};

export default LegendItem;
