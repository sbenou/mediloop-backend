
import { WeekHours, DayHours, defaultHours } from "@/types/pharmacy/hours";

// Helper to parse hours from string format to structured format
export const parseStringHours = (hoursString: string): WeekHours => {
  // Start with default hours for safety
  const result = {...defaultHours};
  
  try {
    const lines = hoursString.split(',').map(l => l.trim());
    
    lines.forEach(line => {
      // Handle patterns like "Mon-Fri: 8:00-19:00"
      if (line.includes('-') && line.includes(':')) {
        const [daysStr, timeStr] = line.split(':').map(s => s.trim());
        const [startTime, endTime] = timeStr.split('-').map(s => s.trim());
        
        if (daysStr.includes('-')) {
          // Handle day ranges like "Mon-Fri"
          const [startDay, endDay] = daysStr.split('-').map(s => s.trim().toLowerCase());
          const dayMap: {[key: string]: keyof WeekHours} = {
            'mon': 'monday', 'monday': 'monday',
            'tue': 'tuesday', 'tuesday': 'tuesday',
            'wed': 'wednesday', 'wednesday': 'wednesday', 
            'thu': 'thursday', 'thursday': 'thursday',
            'fri': 'friday', 'friday': 'friday',
            'sat': 'saturday', 'saturday': 'saturday',
            'sun': 'sunday', 'sunday': 'sunday'
          };
          
          const days: (keyof WeekHours)[] = [];
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
          const startIdx = dayOrder.indexOf(dayMap[startDay] || 'monday');
          const endIdx = dayOrder.indexOf(dayMap[endDay] || 'friday');
          
          if (startIdx !== -1 && endIdx !== -1) {
            for (let i = startIdx; i <= endIdx; i++) {
              days.push(dayOrder[i] as keyof WeekHours);
            }
            
            days.forEach(day => {
              result[day] = {
                open: true,
                openTime: startTime,
                closeTime: endTime
              };
            });
          }
        } else {
          // Handle single days like "Sat"
          const day = daysStr.toLowerCase();
          const dayMap: {[key: string]: keyof WeekHours} = {
            'mon': 'monday', 'monday': 'monday',
            'tue': 'tuesday', 'tuesday': 'tuesday',
            'wed': 'wednesday', 'wednesday': 'wednesday', 
            'thu': 'thursday', 'thursday': 'thursday',
            'fri': 'friday', 'friday': 'friday',
            'sat': 'saturday', 'saturday': 'saturday',
            'sun': 'sunday', 'sunday': 'sunday'
          };
          
          if (dayMap[day]) {
            result[dayMap[day]] = {
              open: true,
              openTime: startTime,
              closeTime: endTime
            };
          }
        }
      }
      
      // Handle "closed" patterns
      if (line.toLowerCase().includes('closed')) {
        const day = line.split(':')[0].trim().toLowerCase();
        const dayMap: {[key: string]: keyof WeekHours} = {
          'mon': 'monday', 'monday': 'monday',
          'tue': 'tuesday', 'tuesday': 'tuesday',
          'wed': 'wednesday', 'wednesday': 'wednesday', 
          'thu': 'thursday', 'thursday': 'thursday',
          'fri': 'friday', 'friday': 'friday',
          'sat': 'saturday', 'saturday': 'saturday',
          'sun': 'sunday', 'sunday': 'sunday'
        };
        
        if (dayMap[day]) {
          result[dayMap[day]] = {
            open: false,
            openTime: '09:00',
            closeTime: '18:00'
          };
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error parsing string hours:', error);
    return defaultHours;
  }
};

// Helper to validate hours data and fill in any missing properties
export const validateHoursData = (data: any): WeekHours => {
  const result = {...defaultHours};
  
  // Skip validation if data is not an object
  if (!data || typeof data !== 'object') {
    return result;
  }

  // For each day in WeekHours, validate and fill in missing properties
  Object.keys(defaultHours).forEach((day) => {
    const typedDay = day as keyof WeekHours;
    
    // If day exists in data
    if (data[typedDay]) {
      result[typedDay] = {
        // Use values from data if they exist, otherwise use defaults
        open: typeof data[typedDay].open === 'boolean' ? data[typedDay].open : defaultHours[typedDay].open,
        openTime: data[typedDay].openTime || defaultHours[typedDay].openTime,
        closeTime: data[typedDay].closeTime || defaultHours[typedDay].closeTime
      };
    }
    // If day doesn't exist in data, default values are already in result
  });

  return result;
};

// Function to format the hours in the original display format
export const formatHoursDisplay = (weekHours: WeekHours): string[] => {
  try {
    // Ensure weekHours is valid
    if (!weekHours) return [];
    
    // Check if weekdays (Mon-Fri) have the same schedule
    const weekdayHours = [
      weekHours.monday,
      weekHours.tuesday,
      weekHours.wednesday,
      weekHours.thursday,
      weekHours.friday
    ];
    
    // Ensure all days have valid properties
    const validWeekdayHours = weekdayHours.map(day => ({
      open: typeof day?.open === 'boolean' ? day.open : false,
      openTime: day?.openTime || '09:00',
      closeTime: day?.closeTime || '18:00'
    }));
    
    const allWeekdaysSame = validWeekdayHours.every(day => 
      day.open === validWeekdayHours[0].open && 
      day.openTime === validWeekdayHours[0].openTime && 
      day.closeTime === validWeekdayHours[0].closeTime
    );
    
    const formattedHours = [];
    
    // If all weekdays have the same schedule, display them as Mon-Fri
    if (allWeekdaysSame) {
      if (validWeekdayHours[0].open) {
        formattedHours.push(`Mon-Fri: ${validWeekdayHours[0].openTime}-${validWeekdayHours[0].closeTime}`);
      } else {
        formattedHours.push('Mon-Fri: Closed');
      }
    } else {
      // Display each weekday individually
      const dayMap: Record<number, string> = {
        0: 'Mon',
        1: 'Tue',
        2: 'Wed',
        3: 'Thu',
        4: 'Fri'
      };
      
      validWeekdayHours.forEach((day, index) => {
        if (day.open) {
          formattedHours.push(`${dayMap[index]}: ${day.openTime}-${day.closeTime}`);
        } else {
          formattedHours.push(`${dayMap[index]}: Closed`);
        }
      });
    }
    
    // Add Saturday and Sunday with safety checks
    const satData = weekHours.saturday || defaultHours.saturday;
    const sunData = weekHours.sunday || defaultHours.sunday;
    
    if (satData.open) {
      formattedHours.push(`Sat: ${satData.openTime || '09:00'}-${satData.closeTime || '13:00'}`);
    } else {
      formattedHours.push('Sat: Closed');
    }
    
    if (sunData.open) {
      formattedHours.push(`Sun: ${sunData.openTime || '09:00'}-${sunData.closeTime || '18:00'}`);
    } else {
      formattedHours.push('Sun: Closed');
    }
    
    return formattedHours;
  } catch (error) {
    console.error('Error formatting hours display:', error);
    return ['Hours information unavailable'];
  }
};
