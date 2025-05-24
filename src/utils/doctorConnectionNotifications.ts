
import { supabase } from '@/lib/supabase';

export const sendConnectionRequestNotification = async (doctorId: string, patientName: string) => {
  try {
    console.log('Sending connection request notification to doctor:', doctorId);
    
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
      throw error;
    }
    
    console.log('Connection request notification sent successfully');
  } catch (error) {
    console.error('Error in sendConnectionRequestNotification:', error);
    // Don't rethrow to prevent blocking the connection request
  }
};
