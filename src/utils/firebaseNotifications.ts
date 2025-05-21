
import { supabase } from '@/lib/supabase';
import { NotificationType } from './notifications';

interface SendFirebaseNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
}

export const sendFirebaseNotification = async ({
  userId, 
  title,
  body,
  type,
  data = {}
}: SendFirebaseNotificationParams) => {
  try {
    // Get FCM token from user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();
      
    if (profileError || !profileData?.fcm_token) {
      console.error('No FCM token found for user:', userId);
      return null;
    }
    
    // Call the Supabase Edge Function to send the notification
    const { data: result, error } = await supabase
      .functions
      .invoke('send-firebase-notification', {
        body: {
          token: profileData.fcm_token,
          notification: {
            title,
            body
          },
          data: {
            type,
            timestamp: new Date().toISOString(),
            ...data
          }
        }
      });
      
    if (error) {
      console.error('Error sending Firebase notification:', error);
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to send Firebase notification:', error);
    return null;
  }
};

// Helper to send doctor connection notifications
export const sendDoctorConnectionFirebaseNotification = async (
  doctorId: string, 
  patientName: string
) => {
  return sendFirebaseNotification({
    userId: doctorId,
    title: 'New Patient Connection Request',
    body: `${patientName} has requested to connect with you as a patient.`,
    type: 'patient_connected',
    data: {
      patientName,
      action: 'VIEW_CONNECTIONS'
    }
  });
};

// Helper to send new prescription notifications
export const sendPrescriptionFirebaseNotification = async (
  recipientId: string, 
  prescriberName: string
) => {
  return sendFirebaseNotification({
    userId: recipientId,
    title: 'New Prescription',
    body: `Dr. ${prescriberName} has created a new prescription for you.`,
    type: 'prescription_created',
    data: {
      prescriberName,
      action: 'VIEW_PRESCRIPTIONS'
    }
  });
};
