import { supabase } from "@/lib/supabase";
import { mockActivities } from "@/components/activity/mockActivities";
import { toast } from "@/components/ui/use-toast";

// Function to seed mock activities for the current user
export const seedTimBurtonData = async () => {
  try {
    console.log("Starting to seed activity data for current user...");
    
    // Get the current authenticated user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      const error = new Error("No authenticated user found. Please log in first.");
      console.error(error);
      return { success: false, error };
    }
    
    const userId = authData.user.id;
    console.log(`Using current user ID: ${userId} for seeding data`);
    
    // 1. First check if the user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return { success: false, error: profileError };
    }
    
    console.log("Profile data found:", profile);

    // 2. Delete existing records first to avoid conflicts
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error("Error deleting existing activities:", deleteError);
      // Continue anyway as this might just mean there are no activities yet
    }

    // 3. Insert mock activities for the current user
    const activitiesForUser = mockActivities.map(activity => ({
      // Use the UUID from mockActivities directly instead of numeric strings
      id: activity.id,
      user_id: userId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
      read: activity.read,
      created_at: activity.timestamp.toISOString(),
      updated_at: activity.timestamp.toISOString()
    }));

    console.log("Preparing to insert activities:", activitiesForUser);

    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .insert(activitiesForUser)
      .select();

    if (activitiesError) {
      console.error("Error inserting activities:", activitiesError);
      return { success: false, error: activitiesError };
    }

    console.log("Activities inserted successfully:", activitiesData);

    return {
      success: true,
      userId: userId,
      activitiesCount: activitiesForUser.length
    };
  } catch (error) {
    console.error("Error loading test data:", error);
    return {
      success: false,
      error
    };
  }
};

// Function to seed user notifications
export const seedUserNotifications = async (userId) => {
  if (!userId) {
    console.error("No user ID provided for seeding notifications");
    return { success: false, error: new Error("No user ID provided") };
  }
  
  try {
    console.log(`Seeding notifications for user: ${userId}`);
    const { data, error } = await supabase.functions.invoke('seed-notifications', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Error seeding notifications:', error);
      return { success: false, error };
    }

    return { success: true, count: data?.count || 0, data };
  } catch (error) {
    console.error('Error seeding notifications:', error);
    return { success: false, error };
  }
};

// Function to authenticate as Tim Burton for testing
export const loginAsTimBurton = async () => {
  try {
    // For a real app, we would sign in properly, but for testing
    // we can simulate it by setting session data
    // This approach depends on your authentication setup
    // This is a simplified example - actual implementation will vary
    
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
