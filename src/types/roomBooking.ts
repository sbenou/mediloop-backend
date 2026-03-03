// ============================================================================
// Room Booking Types for Backend (Deno/TypeScript)
// ============================================================================
// File location: mediloop-backend/src/types/roomBooking.ts
// Description: TypeScript types for the room_bookings table
// ============================================================================

/**
 * Booking status enum
 */
export type BookingStatus =
  | "pending" // Booking requested but not confirmed
  | "confirmed" // Booking confirmed
  | "checked_in" // Patient/staff has checked in
  | "in_progress" // Consultation/meeting in progress
  | "completed" // Consultation/meeting completed
  | "cancelled" // Booking cancelled
  | "no_show"; // Patient/staff did not show up

/**
 * Room type enum
 */
export type RoomType =
  | "waiting_room" // Waiting area for patients
  | "consultation_room" // Doctor consultation room
  | "examination_room" // Medical examination room
  | "treatment_room" // Treatment/procedure room
  | "office" // Staff office/workspace
  | "meeting_room" // Meeting/conference room
  | "other"; // Other room type

/**
 * Room Booking entity
 */
export interface RoomBooking {
  id: string;

  // Organization and Room
  organization_id: string;
  room_name: string; // "Room 101", "Dr. Smith's Office"
  room_type: RoomType;

  // Booking parties
  booked_by: string; // user_id who made the booking
  booked_for: string | null; // user_id of patient/client (null for staff workspace)
  staff_member: string | null; // organization_member_id of staff using the room

  // Time slot
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  duration_minutes: number; // Auto-calculated from start/end time

  // Status
  status: BookingStatus;

  // Booking information
  purpose: string | null; // "Consultation", "Follow-up", "Emergency"
  notes: string | null;

  // Check-in/out tracking
  checked_in_at: string | null;
  checked_out_at: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;

  // Metadata (flexible JSON)
  metadata: BookingMetadata;

  // Cancellation
  cancelled_at: string | null;
  cancelled_by: string | null; // user_id
  cancellation_reason: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Virtual fields (from joins)
  organization?: any;
  patient?: any;
  staff?: any;
}

/**
 * Metadata for room bookings
 */
export interface BookingMetadata {
  // Equipment/resources needed
  equipment_needed?: string[];
  special_requirements?: string;

  // Consultation-specific
  consultation_type?: string; // "first_visit", "follow_up", "emergency"
  symptoms?: string[];

  // Meeting-specific
  attendees?: string[]; // Array of user_ids
  agenda?: string;

  // Additional custom fields
  [key: string]: any;
}

/**
 * DTO for creating a room booking
 */
export interface CreateRoomBookingDTO {
  organization_id: string;
  room_name: string;
  room_type: RoomType;
  booked_for?: string; // Patient user_id
  staff_member?: string; // Staff member organization_member_id
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  purpose?: string;
  notes?: string;
  metadata?: BookingMetadata;
}

/**
 * DTO for updating a room booking
 */
export interface UpdateRoomBookingDTO {
  room_name?: string;
  room_type?: RoomType;
  start_time?: string;
  end_time?: string;
  status?: BookingStatus;
  purpose?: string;
  notes?: string;
  metadata?: Partial<BookingMetadata>;
}

/**
 * Room availability time slot
 */
export interface AvailableTimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

/**
 * Room availability response
 */
export interface RoomAvailability {
  room_name: string;
  room_type: RoomType;
  is_available: boolean;
  available_slots: AvailableTimeSlot[];
  next_available_slot: AvailableTimeSlot | null;
}

/**
 * Room with current status
 */
export interface RoomWithStatus {
  room_name: string;
  room_type: RoomType;
  current_booking: RoomBooking | null;
  next_booking: RoomBooking | null;
  is_occupied: boolean;
}

/**
 * Booking conflict information
 */
export interface BookingConflict {
  conflicting_booking: RoomBooking;
  overlap_start: string;
  overlap_end: string;
  overlap_minutes: number;
}

/**
 * Booking search filters
 */
export interface BookingSearchFilters {
  organization_id?: string;
  room_name?: string | string[];
  room_type?: RoomType | RoomType[];
  status?: BookingStatus | BookingStatus[];
  booked_for?: string; // user_id
  staff_member?: string; // organization_member_id
  start_date?: string; // ISO date (searches bookings on or after this date)
  end_date?: string; // ISO date (searches bookings on or before this date)
}

/**
 * DTO for checking in to a booking
 */
export interface CheckInDTO {
  booking_id: string;
  user_id: string;
  actual_start_time?: string; // Defaults to now
}

/**
 * DTO for checking out of a booking
 */
export interface CheckOutDTO {
  booking_id: string;
  user_id: string;
  actual_end_time?: string; // Defaults to now
  notes?: string; // Additional notes about the visit
}

/**
 * DTO for cancelling a booking
 */
export interface CancelBookingDTO {
  booking_id: string;
  user_id: string;
  cancellation_reason?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for RoomBooking
 */
export function isRoomBooking(obj: any): obj is RoomBooking {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.organization_id === "string" &&
    typeof obj.room_name === "string"
  );
}

/**
 * Type guard for valid BookingStatus
 */
export function isValidBookingStatus(status: string): status is BookingStatus {
  return [
    "pending",
    "confirmed",
    "checked_in",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ].includes(status);
}

/**
 * Type guard for valid RoomType
 */
export function isValidRoomType(type: string): type is RoomType {
  return [
    "waiting_room",
    "consultation_room",
    "examination_room",
    "treatment_room",
    "office",
    "meeting_room",
    "other",
  ].includes(type);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates CreateRoomBookingDTO
 */
export function validateCreateBooking(dto: any): dto is CreateRoomBookingDTO {
  if (!dto.organization_id || typeof dto.organization_id !== "string") {
    throw new Error("organization_id is required");
  }

  if (!dto.room_name || typeof dto.room_name !== "string") {
    throw new Error("room_name is required");
  }

  if (!isValidRoomType(dto.room_type)) {
    throw new Error("Invalid room_type");
  }

  if (!dto.start_time || !dto.end_time) {
    throw new Error("start_time and end_time are required");
  }

  const startTime = new Date(dto.start_time);
  const endTime = new Date(dto.end_time);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error("Invalid date format for start_time or end_time");
  }

  if (endTime <= startTime) {
    throw new Error("end_time must be after start_time");
  }

  return true;
}

/**
 * Checks if two time ranges overlap
 */
export function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculates duration in minutes between two dates
 */
export function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if booking can be cancelled
 */
export function canCancelBooking(booking: RoomBooking): boolean {
  return !["completed", "cancelled", "no_show"].includes(booking.status);
}

/**
 * Checks if booking can be checked in
 */
export function canCheckIn(booking: RoomBooking): boolean {
  if (booking.status !== "confirmed" && booking.status !== "pending") {
    return false;
  }

  // Can only check in within 15 minutes before start time
  const now = new Date();
  const startTime = new Date(booking.start_time);
  const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);

  return minutesUntilStart <= 15;
}

/**
 * Checks if booking can be checked out
 */
export function canCheckOut(booking: RoomBooking): boolean {
  return booking.status === "checked_in" || booking.status === "in_progress";
}

/**
 * Gets booking status color for UI
 */
export function getBookingStatusColor(status: BookingStatus): string {
  const colorMap: Record<BookingStatus, string> = {
    pending: "yellow",
    confirmed: "blue",
    checked_in: "cyan",
    in_progress: "purple",
    completed: "green",
    cancelled: "red",
    no_show: "gray",
  };

  return colorMap[status] || "gray";
}

/**
 * Formats booking time range for display
 */
export function formatBookingTime(booking: RoomBooking): string {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const dateStr = start.toLocaleDateString("en-US", dateOptions);
  const startTimeStr = start.toLocaleTimeString("en-US", timeOptions);
  const endTimeStr = end.toLocaleTimeString("en-US", timeOptions);

  return `${dateStr}, ${startTimeStr} - ${endTimeStr} (${booking.duration_minutes} min)`;
}

/**
 * Finds available time slots in a day
 */
export function findAvailableSlots(
  date: Date,
  existingBookings: RoomBooking[],
  workingHours: { start: number; end: number }, // 24-hour format
  slotDuration: number = 30, // minutes
): AvailableTimeSlot[] {
  const slots: AvailableTimeSlot[] = [];

  const dayStart = new Date(date);
  dayStart.setHours(workingHours.start, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(workingHours.end, 0, 0, 0);

  let currentTime = new Date(dayStart);

  while (currentTime < dayEnd) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);

    // Check if this slot conflicts with any existing booking
    const hasConflict = existingBookings.some((booking) => {
      if (booking.status === "cancelled" || booking.status === "no_show") {
        return false;
      }

      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      return hasTimeOverlap(currentTime, slotEnd, bookingStart, bookingEnd);
    });

    if (!hasConflict) {
      slots.push({
        start_time: currentTime.toISOString(),
        end_time: slotEnd.toISOString(),
        duration_minutes: slotDuration,
      });
    }

    currentTime = slotEnd;
  }

  return slots;
}

// ============================================================================
// Constants
// ============================================================================

export const BOOKING_STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "waiting_room", label: "Waiting Room" },
  { value: "consultation_room", label: "Consultation Room" },
  { value: "examination_room", label: "Examination Room" },
  { value: "treatment_room", label: "Treatment Room" },
  { value: "office", label: "Office" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "other", label: "Other" },
];

export const DEFAULT_SLOT_DURATION = 30; // minutes
export const DEFAULT_WORKING_HOURS = { start: 9, end: 17 }; // 9 AM - 5 PM
export const CHECK_IN_WINDOW_MINUTES = 15; // Can check in 15 min before appointment
