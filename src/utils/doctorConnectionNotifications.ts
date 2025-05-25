
import { supabase } from '@/lib/supabase';

export const sendConnectionRequestNotification = async (doctorId: string, patientName: string) => {
  try {
    console.log('=== Starting notification creation process ===');
    console.log('Doctor ID:', doctorId);
    console.log('Patient name:', patientName);
    
    // First, let's verify the doctor exists
    const { data: doctorProfile, error: doctorError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', doctorId)
      .single();
    
    if (doctorError) {
      console.error('Error fetching doctor profile:', doctorError);
      throw new Error(`Doctor not found: ${doctorError.message}`);
    }
    
    if (!doctorProfile) {
      console.error('Doctor profile not found for ID:', doctorId);
      throw new Error('Doctor profile not found');
    }
    
    console.log('Doctor profile found:', doctorProfile);
    
    // Create notification in database - this will trigger realtime updates
    console.log('Creating notification in database...');
    const notificationData = {
      user_id: doctorId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${patientName} has requested to connect with you`,
      read: false,
      created_at: new Date().toISOString()
    };
    
    console.log('Notification data to insert:', notificationData);
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating notification:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error message:', error.message);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
    
    if (!notification) {
      console.error('Notification was not created - no data returned');
      throw new Error('Notification creation failed - no data returned');
    }
    
    console.log('✅ Notification created successfully in database:', notification);
    
    // Send targeted Firebase push notification to doctor (optional, non-blocking)
    try {
      console.log('Attempting to send Firebase push notification...');
      await sendFirebasePushNotification(doctorId, {
        title: 'New Connection Request',
        body: `${patientName} has requested to connect with you`,
        data: {
          type: 'connection_request',
          patientName: patientName,
          notificationId: notification.id
        }
      });
      console.log('✅ Firebase push notification sent successfully');
    } catch (firebaseError) {
      console.warn('⚠️ Firebase push notification failed (non-critical):', firebaseError);
      // Don't throw here as the database notification was successful
    }
    
    console.log('=== Notification creation process completed successfully ===');
    return notification;
    
  } catch (error) {
    console.error('=== NOTIFICATION CREATION FAILED ===');
    console.error('Error in sendConnectionRequestNotification:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to let the caller handle the error
  }
};

// Function to send targeted Firebase push notifications
const sendFirebasePushNotification = async (userId: string, notificationData: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) => {
  try {
    console.log('Looking up FCM token for user:', userId);
    
    // Get the user's FCM token from the database
    const { data: tokenData, error } = await supabase
      .from('user_notification_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('platform', 'web')
      .single();

    if (error) {
      console.log('Error fetching FCM token:', error);
      return;
    }

    if (!tokenData?.token) {
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
    throw error;
  }
};
