
import { supabase } from "@/lib/supabase";
import { mockActivities } from "@/components/activity/mockActivities";
import { toast } from "@/components/ui/use-toast";

// Mock doctor data for Tim Burton
const timBurtonDoctorData = {
  id: "doctor-tim-burton",
  full_name: "Dr. Tim Burton",
  email: "tim.burton@example.com",
  role: "doctor",
  license_number: "MED-12345-TB",
  city: "Gotham City",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=TimBurton",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Mock notifications for Tim Burton
const timBurtonNotifications = [
  {
    id: "notif-1",
    user_id: "doctor-tim-burton",
    type: "patient_connected",
    title: "New Patient Connection",
    message: "Patient Jack Skellington has connected with you",
    read: false,
    created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
  },
  {
    id: "notif-2",
    user_id: "doctor-tim-burton",
    type: "prescription_created",
    title: "Prescription Sent",
    message: "Prescription #PR-2023-001 for patient Sally has been sent",
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: "notif-3",
    user_id: "doctor-tim-burton",
    type: "payment_failed",
    title: "Payment Failed",
    message: "Your subscription payment has failed. Please update your payment method.",
    read: false,
    created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: "notif-4",
    user_id: "doctor-tim-burton",
    type: "new_teleconsultation",
    title: "New Teleconsultation",
    message: "You have a new teleconsultation scheduled with Edward Scissorhands at 3:00 PM tomorrow",
    read: false,
    created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

// Function to seed Tim Burton's mock data
export const seedTimBurtonData = async () => {
  try {
    // 1. Insert or update Tim Burton's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(timBurtonDoctorData, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 2. Insert mock notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .upsert(timBurtonNotifications, { onConflict: 'id' });

    if (notificationsError) throw notificationsError;

    // 3. Insert mock activities (convert from mockActivities format)
    const activitiesForTimBurton = mockActivities.map(activity => ({
      id: activity.id,
      user_id: "doctor-tim-burton",
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
      read: activity.read,
      created_at: activity.timestamp.toISOString(),
      updated_at: activity.timestamp.toISOString()
    }));

    const { error: activitiesError } = await supabase
      .from('activities')
      .upsert(activitiesForTimBurton, { onConflict: 'id' });

    if (activitiesError) throw activitiesError;

    toast({
      title: "Test data loaded successfully",
      description: "Dr. Tim Burton's data has been loaded for testing",
    });

    return {
      success: true,
      doctorId: "doctor-tim-burton"
    };
  } catch (error) {
    console.error("Error loading test data:", error);
    toast({
      title: "Error loading test data",
      description: "Check console for details",
      variant: "destructive"
    });
    return {
      success: false,
      error
    };
  }
};

// Function to authenticate as Tim Burton for testing
export const loginAsTimBurton = async () => {
  try {
    // For a real app, we would sign in properly, but for testing
    // we can simulate it by setting session data
    // This approach depends on your authentication setup
    // This is a simplified example - actual implementation will vary
    
    // First ensure Tim Burton exists
    await seedTimBurtonData();
    
    // Note: In a real app, you would use proper auth methods
    // This is just for testing and would normally be
    // handled by your auth system
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: "tim.burton@example.com",
      password: "test123" // This would normally be a secure password
    });

    if (sessionError) {
      // If sign in fails (likely because user doesn't exist in auth),
      // we should provide feedback but not fail the test data loading
      console.warn("Could not authenticate as Dr. Tim Burton:", sessionError);
      toast({
        title: "Test data loaded",
        description: "Data loaded but couldn't sign in automatically",
      });
      return { success: true, authenticated: false };
    }

    toast({
      title: "Signed in as Dr. Tim Burton",
      description: "Test account is ready for use",
    });
    
    return { success: true, authenticated: true, session: sessionData };
  } catch (error) {
    console.error("Error signing in as Tim Burton:", error);
    toast({
      title: "Error during test login",
      description: "Check console for details",
      variant: "destructive"
    });
    return { success: false, error };
  }
};
