
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeleconsultationWithUsers {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  status: string;
  patient: {
    full_name: string;
  };
  doctor: {
    full_name: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time and 30 minutes from now
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Fetch upcoming consultations within the next 30 minutes
    const { data: upcomingConsultations, error: upcomingError } = await supabase
      .from("teleconsultations")
      .select(`
        id,
        patient_id,
        doctor_id,
        start_time,
        status,
        patient:patient_id(full_name),
        doctor:doctor_id(full_name)
      `)
      .eq("status", "confirmed")
      .gte("start_time", now.toISOString())
      .lt("start_time", thirtyMinutesFromNow.toISOString());

    if (upcomingError) {
      throw upcomingError;
    }

    // Fetch consultations scheduled for today
    const { data: todayConsultations, error: todayError } = await supabase
      .from("teleconsultations")
      .select(`
        id,
        patient_id,
        doctor_id,
        start_time,
        status,
        patient:patient_id(full_name),
        doctor:doctor_id(full_name)
      `)
      .eq("status", "confirmed")
      .gte("start_time", startOfDay.toISOString())
      .lt("start_time", endOfDay.toISOString());

    if (todayError) {
      throw todayError;
    }

    // Fetch consultations scheduled for tomorrow
    const { data: tomorrowConsultations, error: tomorrowError } = await supabase
      .from("teleconsultations")
      .select(`
        id,
        patient_id,
        doctor_id,
        start_time,
        status,
        patient:patient_id(full_name),
        doctor:doctor_id(full_name)
      `)
      .eq("status", "confirmed")
      .gte("start_time", new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .lt("start_time", new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (tomorrowError) {
      throw tomorrowError;
    }

    // Process all notifications
    const notifications = [];

    // Process 30-minute reminders
    for (const consultation of upcomingConsultations as TeleconsultationWithUsers[]) {
      // Create notification for patient
      notifications.push({
        user_id: consultation.patient_id,
        type: "teleconsultation_reminder",
        title: "Upcoming Teleconsultation",
        message: `Your teleconsultation with Dr. ${consultation.doctor.full_name} is starting in less than 30 minutes.`,
        link: "/dashboard?view=teleconsultations",
      });

      // Create notification for doctor
      notifications.push({
        user_id: consultation.doctor_id,
        type: "teleconsultation_reminder",
        title: "Upcoming Teleconsultation",
        message: `Your teleconsultation with ${consultation.patient.full_name} is starting in less than 30 minutes.`,
        link: "/dashboard?view=teleconsultations",
      });
    }

    // Process today reminders (if not already notified in the 30-minute window)
    for (const consultation of todayConsultations as TeleconsultationWithUsers[]) {
      const alreadyNotified = upcomingConsultations.some(c => c.id === consultation.id);
      if (!alreadyNotified) {
        // Create notification for patient
        notifications.push({
          user_id: consultation.patient_id,
          type: "teleconsultation_reminder",
          title: "Teleconsultation Today",
          message: `You have a teleconsultation with Dr. ${consultation.doctor.full_name} scheduled for today at ${new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          link: "/dashboard?view=teleconsultations",
        });

        // Create notification for doctor
        notifications.push({
          user_id: consultation.doctor_id,
          type: "teleconsultation_reminder",
          title: "Teleconsultation Today",
          message: `You have a teleconsultation with ${consultation.patient.full_name} scheduled for today at ${new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          link: "/dashboard?view=teleconsultations",
        });
      }
    }

    // Process tomorrow reminders
    for (const consultation of tomorrowConsultations as TeleconsultationWithUsers[]) {
      // Create notification for patient
      notifications.push({
        user_id: consultation.patient_id,
        type: "teleconsultation_reminder",
        title: "Teleconsultation Tomorrow",
        message: `You have a teleconsultation with Dr. ${consultation.doctor.full_name} scheduled for tomorrow at ${new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        link: "/dashboard?view=teleconsultations",
      });

      // Create notification for doctor
      notifications.push({
        user_id: consultation.doctor_id,
        type: "teleconsultation_reminder",
        title: "Teleconsultation Tomorrow",
        message: `You have a teleconsultation with ${consultation.patient.full_name} scheduled for tomorrow at ${new Date(consultation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        link: "/dashboard?view=teleconsultations",
      });
    }

    // Insert all notifications if there are any
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        throw notificationError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Teleconsultation reminders processed successfully",
        reminders_sent: notifications.length,
        upcomingCount: upcomingConsultations.length,
        todayCount: todayConsultations.length,
        tomorrowCount: tomorrowConsultations.length,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in teleconsultation-reminders function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        status: 500,
      }
    );
  }
});
