/**
 * Notification Service
 *
 * High-level service for sending notifications through multiple channels:
 * - Firebase Cloud Messaging (mobile push)
 * - WebSocket (web real-time)
 * - Database (notification history)
 *
 * Uses BullMQ to queue notifications for reliable delivery.
 */

import { notificationQueue } from "../queues/notificationQueue.ts";

export interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, any>;
  actions?: Array<{
    id: string;
    title: string;
  }>;
  priority?: "high" | "default" | "low";
  sound?: string;
  badge?: number;
}

export interface NotificationChannels {
  fcm?: boolean; // Firebase Cloud Messaging (mobile)
  websocket?: boolean; // WebSocket (web real-time)
  database?: boolean; // Save to database (always true by default)
}

/**
 * Send notification to specific user
 */
export async function sendNotification(
  userId: string,
  notification: NotificationPayload,
  channels: NotificationChannels = {
    fcm: true,
    websocket: true,
    database: true,
  },
) {
  try {
    // Add job to notification queue
    const job = await notificationQueue.add("send-notification", {
      userId,
      notification,
      channels,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Notification queued for user ${userId}:`, job.id);

    return {
      success: true,
      jobId: job.id,
      message: "Notification queued for delivery",
    };
  } catch (error: any) {
    console.error(`❌ Failed to queue notification for user ${userId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send notification to topic (broadcast to multiple users)
 */
export async function sendToTopic(
  topic: string,
  notification: NotificationPayload,
  channels: NotificationChannels = { fcm: true, database: true },
) {
  try {
    // Add job to notification queue
    const job = await notificationQueue.add("send-to-topic", {
      topic,
      notification,
      channels,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Topic notification queued for "${topic}":`, job.id);

    return {
      success: true,
      jobId: job.id,
      message: `Notification queued for topic: ${topic}`,
    };
  } catch (error: any) {
    console.error(
      `❌ Failed to queue topic notification for "${topic}":`,
      error,
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendToMultipleUsers(
  userIds: string[],
  notification: NotificationPayload,
  channels: NotificationChannels = {
    fcm: true,
    websocket: true,
    database: true,
  },
) {
  try {
    // Add job to notification queue
    const job = await notificationQueue.add("send-to-multiple", {
      userIds,
      notification,
      channels,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ Notification queued for ${userIds.length} users:`, job.id);

    return {
      success: true,
      jobId: job.id,
      message: `Notification queued for ${userIds.length} users`,
    };
  } catch (error: any) {
    console.error(`❌ Failed to queue notification for multiple users:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Schedule notification for later delivery
 */
export async function scheduleNotification(
  userId: string,
  notification: NotificationPayload,
  sendAt: Date,
  channels: NotificationChannels = {
    fcm: true,
    websocket: true,
    database: true,
  },
) {
  try {
    const delay = sendAt.getTime() - Date.now();

    if (delay < 0) {
      throw new Error("Send time must be in the future");
    }

    // Add job with delay
    const job = await notificationQueue.add(
      "send-notification",
      {
        userId,
        notification,
        channels,
        scheduledFor: sendAt.toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        delay, // milliseconds
      },
    );

    console.log(
      `✅ Notification scheduled for user ${userId} at ${sendAt.toISOString()}:`,
      job.id,
    );

    return {
      success: true,
      jobId: job.id,
      message: `Notification scheduled for ${sendAt.toISOString()}`,
    };
  } catch (error: any) {
    console.error(
      `❌ Failed to schedule notification for user ${userId}:`,
      error,
    );
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send appointment reminder (convenience function)
 */
export async function sendAppointmentReminder(
  userId: string,
  appointment: {
    id: string;
    doctorName: string;
    startTime: Date;
    type: "teleconsultation" | "in-person";
  },
) {
  const minutesUntil = Math.floor(
    (appointment.startTime.getTime() - Date.now()) / 1000 / 60,
  );

  return await sendNotification(userId, {
    title: "📅 Appointment Reminder",
    body: `${appointment.type === "teleconsultation" ? "Teleconsultation" : "Appointment"} with ${appointment.doctorName} in ${minutesUntil} minutes`,
    data: {
      type: "appointment_reminder",
      appointmentId: appointment.id,
      screen: "AppointmentDetails",
    },
    actions: [
      {
        id: "join",
        title:
          appointment.type === "teleconsultation" ? "Join Now" : "View Details",
      },
      { id: "reschedule", title: "Reschedule" },
    ],
    priority: "high",
    sound: "reminder.wav",
  });
}

/**
 * Send prescription ready notification (convenience function)
 */
export async function sendPrescriptionReady(
  userId: string,
  prescription: {
    id: string;
    pharmacyName: string;
    pharmacyAddress: string;
  },
) {
  return await sendNotification(userId, {
    title: "💊 Prescription Ready",
    body: `Your prescription is ready for pickup at ${prescription.pharmacyName}`,
    data: {
      type: "prescription_ready",
      prescriptionId: prescription.id,
      screen: "PrescriptionDetails",
    },
    actions: [
      { id: "directions", title: "Get Directions" },
      { id: "call", title: "Call Pharmacy" },
    ],
    priority: "default",
    sound: "default",
  });
}

/**
 * Send new message notification (convenience function)
 */
export async function sendNewMessage(
  userId: string,
  message: {
    id: string;
    senderName: string;
    senderRole: "doctor" | "patient" | "pharmacist";
    preview: string;
    conversationId: string;
  },
) {
  const roleEmoji =
    message.senderRole === "doctor"
      ? "👨‍⚕️"
      : message.senderRole === "pharmacist"
        ? "💊"
        : "👤";

  return await sendNotification(userId, {
    title: `${roleEmoji} ${message.senderName}`,
    body: message.preview,
    data: {
      type: "new_message",
      messageId: message.id,
      conversationId: message.conversationId,
      screen: "Chat",
    },
    priority: "default",
    sound: "message.wav",
  });
}

/**
 * Send system maintenance alert to all users
 */
export async function sendMaintenanceAlert(
  scheduledAt: Date,
  duration: string,
) {
  return await sendToTopic("all_users", {
    title: "⚠️ System Maintenance",
    body: `Mediloop will be unavailable from ${scheduledAt.toLocaleTimeString()} for ${duration}`,
    data: {
      type: "maintenance",
      scheduledAt: scheduledAt.toISOString(),
    },
    priority: "high",
    sound: "alert.wav",
  });
}

/**
 * Send security alert to healthcare providers
 */
export async function sendSecurityAlert(
  message: string,
  actionRequired?: string,
) {
  return await sendToTopic("all_healthcare_providers", {
    title: "🔒 Security Alert",
    body: message,
    data: {
      type: "security_alert",
      actionRequired: actionRequired || "none",
    },
    actions: actionRequired
      ? [
          { id: "action", title: actionRequired },
          { id: "dismiss", title: "Dismiss" },
        ]
      : undefined,
    priority: "high",
    sound: "alert.wav",
  });
}

/**
 * Send drug shortage alert to pharmacists
 */
export async function sendDrugShortageAlert(
  drugName: string,
  alternatives?: string[],
) {
  return await sendToTopic("pharmacists_all", {
    title: "⚠️ Drug Shortage Alert",
    body: `${drugName} - Limited supply nationwide`,
    data: {
      type: "drug_shortage",
      drugName,
      alternatives: alternatives ? JSON.stringify(alternatives) : undefined,
    },
    priority: "high",
    sound: "alert.wav",
  });
}

/**
 * Alert online doctors in specific clinic about new patient
 */
export async function alertDoctorsNewPatient(
  clinicId: string,
  patient: {
    id: string;
    symptoms: string;
    urgency: "low" | "medium" | "high";
  },
) {
  const urgencyEmoji =
    patient.urgency === "high"
      ? "🚨"
      : patient.urgency === "medium"
        ? "⚠️"
        : "ℹ️";

  return await sendToTopic(`clinic_id_${clinicId}_doctors_online`, {
    title: `${urgencyEmoji} New ${patient.urgency === "high" ? "Urgent " : ""}Patient`,
    body: `Patient waiting: ${patient.symptoms}`,
    data: {
      type: "new_patient_waiting",
      patientId: patient.id,
      clinicId,
      urgency: patient.urgency,
      screen: "AcceptPatient",
    },
    actions: [
      { id: "accept", title: "Accept Patient" },
      { id: "view_details", title: "View Details" },
    ],
    priority: patient.urgency === "high" ? "high" : "default",
    sound: patient.urgency === "high" ? "emergency.wav" : "default",
  });
}

/**
 * Send regulatory update to doctors in specific region
 */
export async function sendRegulatoryUpdate(
  region: string,
  update: {
    title: string;
    summary: string;
    documentUrl: string;
  },
) {
  return await sendToTopic(`doctors_region_${region}`, {
    title: `📋 ${update.title}`,
    body: update.summary,
    data: {
      type: "regulatory_update",
      region,
      documentUrl: update.documentUrl,
    },
    priority: "default",
    sound: "default",
  });
}

/**
 * Send CME/training opportunity to doctors by specialty
 */
export async function sendTrainingOpportunity(
  specialty: string,
  training: {
    title: string;
    datetime: Date;
    credits: number;
    registrationUrl: string;
  },
) {
  return await sendToTopic(`doctors_specialty_${specialty}`, {
    title: `📚 ${training.title}`,
    body: `${training.datetime.toLocaleDateString()} - ${training.credits} CME credits`,
    data: {
      type: "training_opportunity",
      specialty,
      datetime: training.datetime.toISOString(),
      registrationUrl: training.registrationUrl,
    },
    actions: [
      { id: "register", title: "Register Now" },
      { id: "remind_later", title: "Remind Me Later" },
    ],
    priority: "default",
    sound: "default",
  });
}
