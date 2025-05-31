
import { supabase } from '@/lib/supabase';

interface FirebaseNotificationData {
  title: string;
  body: string;
  type?: string;
  userId?: string;
  data?: Record<string, any>;
}

export const sendFirebaseNotification = async (
  userId: string,
  notificationData: FirebaseNotificationData
): Promise<boolean> => {
  try {
    // Get user's FCM tokens
    const { data: tokens } = await supabase
      .from('user_notification_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('platform', 'web');

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user:', userId);
      return false;
    }

    // For now, just log since we don't have the actual notification sending implemented
    console.log('Would send notification to tokens:', tokens.map(t => t.token));
    console.log('Notification data:', notificationData);
    
    return true;
  } catch (error) {
    console.error('Error sending Firebase notification:', error);
    return false;
  }
};

export const subscribeToFirebaseNotifications = async (userId: string, token: string): Promise<boolean> => {
  try {
    // Check if user has notification preferences - for now just continue without them
    console.log('Checking notification preferences for user:', userId);
    
    // Upsert the FCM token
    const { error } = await supabase
      .from('user_notification_tokens')
      .upsert({
        user_id: userId,
        token,
        platform: 'web',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to Firebase notifications:', error);
    return false;
  }
};

export const unsubscribeFromFirebaseNotifications = async (userId: string, token?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('user_notification_tokens')
      .delete()
      .eq('user_id', userId);

    if (token) {
      query = query.eq('token', token);
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing FCM token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from Firebase notifications:', error);
    return false;
  }
};
