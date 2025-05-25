
import { supabase } from '@/lib/supabase';

export const sendConnectionRequestNotification = async (doctorId: string, patientName: string) => {
  try {
    console.log('Creating connection request notification for doctor:', doctorId);
    console.log('Patient name:', patientName);
    
    // Create notification in database - this will trigger realtime updates
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: doctorId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${patientName} has requested to connect with you`,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connection notification:', error);
      throw error;
    }
    
    console.log('Connection request notification created successfully:', notification);
    
    // Send targeted Firebase push notification to doctor
    await sendFirebasePushNotification(doctorId, {
      title: 'New Connection Request',
      body: `${patientName} has requested to connect with you`,
      data: {
        type: 'connection_request',
        patientName: patientName,
        notificationId: notification.id
      }
    });
    
    return notification;
    
  } catch (error) {
    console.error('Error in sendConnectionRequestNotification:', error);
    // Don't rethrow to prevent blocking the connection request
    return null;
  }
};

// Function to send targeted Firebase push notifications
const sendFirebasePushNotification = async (userId: string, notificationData: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) => {
  try {
    // Get the user's FCM token from the database
    const { data: tokenData, error } = await supabase
      .from('user_notification_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('platform', 'web')
      .single();

    if (error || !tokenData?.token) {
      console.log('No FCM token found for user:', userId);
      return;
    }

    // In a real implementation, you would call your backend service here
    // to send the push notification using Firebase Admin SDK
    console.log('Would send Firebase push notification to token:', tokenData.token.substring(0, 20) + '...');
    console.log('Notification data:', notificationData);
    
    // TODO: Implement actual Firebase push notification sending via edge function
    // This would require a Supabase edge function that uses Firebase Admin SDK
    
  } catch (error) {
    console.error('Error sending Firebase push notification:', error);
  }
};
