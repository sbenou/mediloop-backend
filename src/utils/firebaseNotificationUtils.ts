
import { supabase } from '@/lib/supabase';
import { messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';

// Function to register a user's FCM token with the backend
export const registerFCMToken = async (userId: string, token: string) => {
  if (!userId || !token) {
    console.warn('Missing userId or token for FCM registration');
    return false;
  }

  try {
    console.log('Registering FCM token for user:', userId);
    
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
    
    console.log('FCM token registered successfully');
    return true;
  } catch (error) {
    console.error('Exception registering FCM token:', error);
    return false;
  }
};

// Function to get or create a new FCM token
export const getOrCreateFCMToken = async () => {
  try {
    if (!messaging) {
      console.warn('Firebase messaging not initialized or not supported in this environment');
      return null;
    }
    
    console.log('Requesting FCM token...');
    const currentToken = await getToken(messaging, {
      vapidKey: 'BLCaFclmh-2Cegf7Qc4XM9ZbL1cf9_73VKJUDsKRpGbAD3gObsp7uLLxNlN6PdEUgz9KpFaI31L3Go6JWdRgXkU'
    });
    
    if (currentToken) {
      console.log('FCM token obtained');
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
  if (!userId) {
    console.warn('Missing userId for notification preference update');
    return false;
  }

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

// New function to test push notification delivery
export const testPushNotification = async (userId: string, title: string, message: string) => {
  try {
    console.log('Testing push notification for user:', userId);
    
    // Call the background job to send a test notification
    const { data, error } = await supabase.functions.invoke('process-connection-notifications', {
      body: { 
        doctorId: userId, 
        patientName: 'Test Patient',
        isTest: true,
        customTitle: title,
        customMessage: message
      }
    });
    
    if (error) {
      console.error('Error sending test push notification:', error);
      return false;
    }
    
    console.log('Test push notification sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception sending test push notification:', error);
    return false;
  }
};
