
import React from 'react';
import LegendItem from './LegendItem';

const CalendarLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <LegendItem color="bg-green-100" label="Available" />
      <LegendItem color="bg-red-100" label="Booked" />
      <LegendItem color="bg-gray-100" label="Unavailable" />
    </div>
  );
};

export default CalendarLegend;
