
import { Activity } from "./ActivityItem";

// Generate a random date within the last 30 days
const getRandomDate = (daysAgo: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

export const mockActivities: Activity[] = [
  {
    id: "1",
    type: "prescription_created",
    title: "New Prescription Added",
    description: "Dr. Smith has created a new prescription for Amoxicillin 500mg.",
    timestamp: getRandomDate(1), // Today
    read: false
  },
  {
    id: "2",
    type: "order_placed",
    title: "Order Placed",
    description: "Your order #12345 for $78.50 has been placed successfully.",
    timestamp: getRandomDate(1), // Today
    read: false
  },
  {
    id: "3",
    type: "doctor_connected",
    title: "New Doctor Connection",
    description: "Dr. Johnson, Cardiologist, has accepted your connection request.",
    timestamp: getRandomDate(2), // Yesterday
    read: true
  },
  {
    id: "4",
    type: "order_shipped",
    title: "Order Shipped",
    description: "Your medication order #12345 has been shipped and is on its way.",
    timestamp: getRandomDate(2), // Yesterday
    read: false
  },
  {
    id: "5",
    type: "appointment_scheduled",
    title: "Teleconsultation Scheduled",
    description: "Your teleconsultation with Dr. Williams is confirmed for tomorrow at 10:00 AM.",
    timestamp: getRandomDate(3),
    read: true
  },
  {
    id: "6",
    type: "prescription_updated",
    title: "Prescription Updated",
    description: "Your prescription for Lisinopril has been updated from 10mg to 20mg daily.",
    timestamp: getRandomDate(4),
    read: false
  },
  {
    id: "7",
    type: "system_alert",
    title: "Payment Failed",
    description: "Your payment for order #54321 was declined. Please update your payment method.",
    timestamp: getRandomDate(5),
    read: false
  },
  {
    id: "8",
    type: "profile_updated",
    title: "Profile Information Updated",
    description: "Your profile information has been successfully updated.",
    timestamp: getRandomDate(6),
    read: true
  },
  {
    id: "9",
    type: "order_delivered",
    title: "Order Delivered",
    description: "Your order #98765 has been delivered to your default address.",
    timestamp: getRandomDate(10),
    read: true
  },
  {
    id: "10",
    type: "payment_processed",
    title: "Payment Processed",
    description: "Your payment of $45.99 for order #87654 has been processed successfully.",
    timestamp: getRandomDate(12),
    read: true
  },
  {
    id: "11",
    type: "prescription_created",
    title: "New Prescription Added",
    description: "Dr. Brown has created a new prescription for Metformin 1000mg.",
    timestamp: getRandomDate(15),
    read: true
  },
  {
    id: "12",
    type: "appointment_scheduled",
    title: "Appointment Confirmed",
    description: "Your in-person appointment with Dr. Garcia is confirmed for next Tuesday at 2:00 PM.",
    timestamp: getRandomDate(20),
    read: true
  }
];
