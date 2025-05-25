
import { supabase } from '@/lib/supabase';

// Background job approach for connection request notifications
export async function sendConnectionRequestNotification(doctorId: string, patientName: string) {
  try {
    console.log('Sending connection request notification via background job:', { doctorId, patientName });
    
    // Call the background job edge function
    const { data, error } = await supabase.functions.invoke('process-connection-notifications', {
      body: { doctorId, patientName }
    });
    
    if (error) {
      console.error('Error calling background job:', error);
      throw new Error(`Background job failed: ${error.message}`);
    }
    
    console.log('Background job completed successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Error in sendConnectionRequestNotification:', error);
    throw error;
  }
}

// Alternative direct approach (fallback if background job fails)
export async function sendConnectionRequestNotificationDirect(doctorId: string, patientName: string) {
  try {
    console.log('Sending connection request notification directly:', { doctorId, patientName });
    
    // Create in-app notification directly
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: doctorId,
        type: 'connection_request',
        title: 'New Patient Connection Request',
        message: `${patientName} has requested to connect with you as a patient.`,
        link: '/dashboard?section=patients&profileTab=active',
        meta: {
          patientName,
          timestamp: new Date().toISOString(),
          source: 'direct_fallback'
        },
        read: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating direct notification:', error);
      throw error;
    }
    
    console.log('Direct notification created successfully:', notification);
    return notification;
    
  } catch (error) {
    console.error('Error in sendConnectionRequestNotificationDirect:', error);
    throw error;
  }
}
