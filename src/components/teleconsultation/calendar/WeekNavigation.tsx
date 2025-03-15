
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { startOfWeek } from 'date-fns';

interface WeekNavigationProps {
  currentWeek: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  currentWeek,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" onClick={onPreviousWeek} title="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        className="whitespace-nowrap"
        onClick={onCurrentWeek}
      >
        <CalendarIcon className="h-4 w-4 mr-2" />
        Current Week
      </Button>
      <Button variant="outline" size="icon" onClick={onNextWeek} title="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WeekNavigation;
