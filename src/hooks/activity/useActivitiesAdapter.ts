
import { Activity } from './types';

// This adapter converts activities from the database format to the component format
export const adaptActivitiesForComponent = (activities: Activity[]): Activity[] => {
  return activities.map(activity => {
    // Ensure all required properties are present for component consumption
    return {
      ...activity,
      // Ensure read property is always boolean
      read: typeof activity.read === 'boolean' ? activity.read : 
            activity.status === 'read',
      // Ensure timestamp is always present
      timestamp: activity.timestamp || new Date().toISOString()
    };
  });
};
