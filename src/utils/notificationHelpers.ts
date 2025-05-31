
import { supabase } from '@/lib/supabase';
import { createNotification } from './notifications';

export const sendDoctorConnectionNotification = async (
  doctorId: string,
  patientName: string
): Promise<boolean> => {
  try {
    // Get doctor profile
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', doctorId)
      .single();

    if (!doctorProfile) {
      console.error('Doctor profile not found');
      return false;
    }

    // Create notification for the doctor
    await createNotification({
      userId: doctorId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${patientName} has requested to connect with you.`,
      link: '/dashboard?view=patients',
      meta: {
        patientName,
        requestedAt: new Date().toISOString()
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending doctor connection notification:', error);
    return false;
  }
};

export const sendPatientNotification = async (
  patientId: string,
  title: string,
  message: string,
  type: string = 'general',
  link?: string,
  meta?: Record<string, any>
): Promise<boolean> => {
  try {
    await createNotification({
      userId: patientId,
      type: type as any, // Type assertion to handle the string type
      title,
      message,
      link,
      meta
    });

    return true;
  } catch (error) {
    console.error('Error sending patient notification:', error);
    return false;
  }
};

export const sendBulkNotification = async (
  userIds: string[],
  title: string,
  message: string,
  type: string = 'general',
  link?: string,
  meta?: Record<string, any>
): Promise<boolean> => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      link,
      meta,
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error sending bulk notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendBulkNotification:', error);
    return false;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
};
