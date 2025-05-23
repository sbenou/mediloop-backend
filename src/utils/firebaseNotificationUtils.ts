
import { supabase } from '@/lib/supabase';
import { messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';

// Function to register a user's FCM token with the backend
export const registerFCMToken = async (userId: string, token: string) => {
  try {
    const { error } = await supabase
      .from('user_notification_tokens')
      .upsert({
        user_id: userId,
        token,
        platform: 'web',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, token'
      });
      
    if (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception registering FCM token:', error);
    return false;
  }
};

// Function to get or create a new FCM token
export const getOrCreateFCMToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'BK2yjKiT7Faf6GDkPBWTIWXqZFCZcI1ODQxsJI4_SpU26Md1c-9GVPYBqRWY6up56CrSCPbU18bi4RXdQtGZwxE'
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('Error getting or creating FCM token:', error);
    return null;
  }
};

// Function to update a user's notification preferences
export const updateNotificationPreferences = async (userId: string, preferences: Record<string, boolean>) => {
  try {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating notification preferences:', error);
    return false;
  }
};
