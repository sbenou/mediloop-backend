import { WeekHours, defaultHours } from '@/types/pharmacy/hours';

/**
 * Formats the structured week hours into an array of display strings
 */
export const formatHoursDisplay = (hours: WeekHours | string): string[] => {
  // If it's a string, try to parse it first
  if (typeof hours === 'string') {
    const parsed = parseStringHours(hours);
    return formatHoursDisplayFromWeekHours(parsed);
  }
  
  return formatHoursDisplayFromWeekHours(hours);
};

/**
 * Helper function to format WeekHours into display strings
 */
const formatHoursDisplayFromWeekHours = (hours: WeekHours): string[] => {
  const result: string[] = [];
  
  const days: Array<[keyof WeekHours, string]> = [
    ['monday', 'Monday'],
    ['tuesday', 'Tuesday'],
    ['wednesday', 'Wednesday'],
    ['thursday', 'Thursday'],
    ['friday', 'Friday'],
    ['saturday', 'Saturday'],
    ['sunday', 'Sunday']
  ];
  
  days.forEach(([dayKey, dayName]) => {
    const dayData = hours[dayKey];
    
    if (!dayData.open) {
      result.push(`${dayName}: Closed`);
    } else {
      result.push(`${dayName}: ${dayData.openTime} - ${dayData.closeTime}`);
    }
  });
  
  return result;
};

/**
 * Convert WeekHours object to a string representation
 */
export const stringifyWeekHours = (weekHours: WeekHours): string => {
  return JSON.stringify(weekHours);
};

/**
 * Attempt to parse a string-formatted hours text into structured WeekHours
 */
export const parseHoursText = (hoursText: string): WeekHours | null => {
  if (!hoursText || hoursText.trim() === '') {
    return null;
  }
  
  try {
    // Try to parse JSON directly if it's in that format
    if (hoursText.trim().startsWith('{')) {
      return validateHoursData(JSON.parse(hoursText));
    }
    
    // Otherwise, try to parse text format
    return parseStringHours(hoursText);
  } catch (error) {
    console.error('Error parsing hours text:', error);
    return null;
  }
};

/**
 * Attempt to parse a string-formatted hours text into structured WeekHours
 */
export const parseStringHours = (hoursText: string): WeekHours => {
  // Start with default hours
  const result: WeekHours = JSON.parse(JSON.stringify(defaultHours));
  
  if (!hoursText || hoursText.trim() === '') {
    return result;
  }
  
  try {
    // Try to parse JSON directly if it's in that format
    if (hoursText.trim().startsWith('{')) {
      return validateHoursData(JSON.parse(hoursText));
    }
    
    // Otherwise, try to parse text format
    const lines = hoursText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    
    // Map of day names to keys in our WeekHours type
    const dayMapping: Record<string, keyof WeekHours> = {
      'monday': 'monday',
      'mon': 'monday',
      'tuesday': 'tuesday',
      'tue': 'tuesday',
      'wednesday': 'wednesday',
      'wed': 'wednesday',
      'thursday': 'thursday',
      'thu': 'thursday',
      'friday': 'friday',
      'fri': 'friday',
      'saturday': 'saturday',
      'sat': 'saturday',
      'sunday': 'sunday',
      'sun': 'sunday'
    };
    
    for (const line of lines) {
      // Skip empty lines
      if (!line) continue;
      
      // Check for common patterns:
      
      // 1. "Monday: 9:00 - 17:00" or "Monday: Closed"
      const singleDayMatch = line.match(/^([\w]+):\s*([\d:]+)\s*-\s*([\d:]+)|^([\w]+):\s*Closed/i);
      
      if (singleDayMatch) {
        const dayName = (singleDayMatch[1] || singleDayMatch[4]).toLowerCase();
        const dayKey = dayMapping[dayName];
        
        if (dayKey) {
          if (singleDayMatch[2] && singleDayMatch[3]) {
            // Time range specified
            result[dayKey] = { 
              open: true, 
              openTime: formatTimeString(singleDayMatch[2]), 
              closeTime: formatTimeString(singleDayMatch[3])
            };
          } else {
            // "Closed" specified
            result[dayKey] = { ...result[dayKey], open: false };
          }
        }
        continue;
      }
      
      // 2. "Monday to Friday: 9:00 - 17:00"
      const dayRangeMatch = line.match(/^([\w]+)\s+to\s+([\w]+):\s*([\d:]+)\s*-\s*([\d:]+)/i);
      
      if (dayRangeMatch) {
        const startDay = dayRangeMatch[1].toLowerCase();
        const endDay = dayRangeMatch[2].toLowerCase();
        const startTime = formatTimeString(dayRangeMatch[3]);
        const endTime = formatTimeString(dayRangeMatch[4]);
        
        // Get the indices of the days to create a range
        const days = Object.keys(dayMapping);
        const startIdx = days.indexOf(startDay);
        const endIdx = days.indexOf(endDay);
        
        if (startIdx >= 0 && endIdx >= 0) {
          for (let i = startIdx; i <= endIdx; i++) {
            const dayKey = dayMapping[days[i]] as keyof WeekHours;
            if (dayKey) {
              result[dayKey] = { open: true, openTime: startTime, closeTime: endTime };
            }
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing hours string:', error);
    return result;
  }
};

/**
 * Format a time string to ensure it's in the proper format (HH:MM)
 */
const formatTimeString = (timeStr: string): string => {
  // Handle various time formats
  const timeParts = timeStr.match(/(\d+)(?::(\d+))?(?:\s*(am|pm))?/i);
  
  if (!timeParts) return timeStr;
  
  let hours = parseInt(timeParts[1], 10);
  const minutes = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
  const period = timeParts[3] ? timeParts[3].toLowerCase() : null;
  
  // Convert 12-hour format to 24-hour format if needed
  if (period === 'pm' && hours < 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }
  
  // Format as HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Validate and fill in missing properties in hours data
 */
export const validateHoursData = (data: any): WeekHours => {
  const result = JSON.parse(JSON.stringify(defaultHours));
  
  if (!data) return result;
  
  // List of expected day keys
  const dayKeys: (keyof WeekHours)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];
  
  // Copy valid day data or use default
  dayKeys.forEach(day => {
    if (data[day]) {
      result[day] = {
        open: data[day].open !== undefined ? !!data[day].open : result[day].open,
        openTime: data[day].openTime || result[day].openTime,
        closeTime: data[day].closeTime || result[day].closeTime
      };
    }
  });
  
  return result;
};
