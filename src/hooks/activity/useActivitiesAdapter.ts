
import { Activity as HookActivity } from './types';
import { Activity as ComponentActivity } from '@/components/activity/ActivityItem';

/**
 * Adapter function to convert between the hook Activity type and the component Activity type
 * This helps bridge the gap between different parts of the codebase that expect different formats
 */
export function adaptActivitiesForComponent(activities: HookActivity[]): ComponentActivity[] {
  return activities.map(activity => ({
    ...activity,
    read: activity.read ?? activity.status === 'read',
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
  }));
}

/**
 * Helper to convert a single activity for the component
 */
export function adaptActivityForComponent(activity: HookActivity): ComponentActivity {
  return {
    ...activity,
    read: activity.read ?? activity.status === 'read',
    timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
  };
}
