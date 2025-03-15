
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { BankHoliday, DoctorAvailability, Teleconsultation } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';

interface TimeSlotGridProps {
  weekDays: Date[];
  hours: number[];
  getDayAvailability: (dayOfWeek: number) => DoctorAvailability | undefined;
  isTimeSlotAvailable: (day: Date, hour: number) => boolean;
  getTeleconsultationAtTime: (day: Date, hour: number) => Teleconsultation | undefined;
  isBankHoliday: (date: Date) => BankHoliday | undefined;
  onTimeSlotClick: (day: Date, hour: number) => void;
  showBookingControls: boolean;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  weekDays,
  hours,
  getDayAvailability,
  isTimeSlotAvailable,
  getTeleconsultationAtTime,
  isBankHoliday,
  onTimeSlotClick,
  showBookingControls
}) => {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 font-medium text-center border-r"></div>
          {weekDays.map((day, index) => {
            const holiday = isBankHoliday(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={`header-${index}`} 
                className={`
                  p-2 text-center font-medium border-r
                  ${isToday ? 'bg-blue-50' : ''}
                  ${holiday ? 'bg-red-50' : ''}
                `}
              >
                <div>{format(day, 'EEE')}</div>
                <div className="text-sm">{format(day, 'MMM d')}</div>
                {holiday && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    {holiday.holiday_name}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Hours and time slots */}
        {hours.map(hour => (
          <div key={`hour-${hour}`} className="grid grid-cols-8 border-b">
            {/* Hour column */}
            <div className="p-2 border-r text-center font-medium">
              {hour}:00
            </div>
            
            {/* Days columns */}
            {weekDays.map((day, dayIndex) => {
              const isAvailable = isTimeSlotAvailable(day, hour);
              const teleconsultation = getTeleconsultationAtTime(day, hour);
              const holiday = isBankHoliday(day);
              
              return (
                <div 
                  key={`cell-${dayIndex}-${hour}`} 
                  className={`
                    p-2 border-r h-16 relative
                    ${holiday ? 'bg-gray-50' : isAvailable ? 'bg-green-100' : 'bg-gray-50'}
                    ${teleconsultation ? 'bg-red-100' : ''}
                    ${isAvailable && !teleconsultation && !holiday && showBookingControls ? 'cursor-pointer hover:bg-green-200' : ''}
                  `}
                  onClick={() => {
                    if (isAvailable && !teleconsultation && !holiday && showBookingControls) {
                      onTimeSlotClick(day, hour);
                    }
                  }}
                >
                  {teleconsultation && (
                    <div className="text-xs p-1 bg-red-200 rounded">
                      <div className="font-semibold">{teleconsultation.reason || 'Teleconsultation'}</div>
                      <div>
                        {format(new Date(teleconsultation.start_time), 'HH:mm')} - 
                        {format(new Date(teleconsultation.end_time), 'HH:mm')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotGrid;
