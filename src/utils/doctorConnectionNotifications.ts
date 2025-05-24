
import { supabase } from '@/lib/supabase';

export const sendConnectionRequestNotification = async (doctorId: string, patientName: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: doctorId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${patientName} has requested to connect with you`,
        read: false
      });

    if (error) {
      console.error('Error sending connection notification:', error);
    }
  } catch (error) {
    console.error('Error in sendConnectionRequestNotification:', error);
  }
};
