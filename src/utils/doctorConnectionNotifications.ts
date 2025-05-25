
import { supabase } from '@/lib/supabase';

export const sendConnectionRequestNotification = async (doctorId: string, patientName: string) => {
  try {
    console.log('=== Starting notification creation process ===');
    console.log('Doctor ID:', doctorId);
    console.log('Patient name:', patientName);
    
    // First, let's verify the doctor exists and get their tenant info
    const { data: doctorProfile, error: doctorError } = await supabase
      .from('profiles')
      .select('id, full_name, email, tenant_id')
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
    
    // Create notification in database with tenant awareness
    console.log('Creating notification in database...');
    const notificationData = {
      user_id: doctorId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${patientName} has requested to connect with you`,
      read: false,
      tenant_id: doctorProfile.tenant_id, // Include tenant_id for proper scoping
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
    console.log('=== Notification creation process completed successfully ===');
    return notification;
    
  } catch (error) {
    console.error('=== NOTIFICATION CREATION FAILED ===');
    console.error('Error in sendConnectionRequestNotification:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to let the caller handle the error
  }
};
