// Consultation booking API: users book a time slot about a topic and get an email with a Google Meet link.
// Backend: com.gunwala.consultation (ConsultationController / AdminConsultationController).

import { getJson, sendJson, sendNoContent } from "./paymentApi";

// ─── Types (mirror the backend DTOs) ──────────────────────────────────────────

export interface ConsultationTopic {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  /** Fee in rupees set by admin; null = free. */
  price: number | null;
}

export interface TopicInput {
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  /** null or 0 = free */
  price: number | null;
}

export interface ConsultationSlot {
  id: number;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
}

export interface AdminSlot extends ConsultationSlot {
  booked: boolean;
  bookingId: number | null;
  bookedByName: string | null;
  topicName: string | null;
}

/** PENDING_PAYMENT: paid topic, slot held until the admin approves the user's payment. */
export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";

export interface ConsultationBooking {
  id: number;
  slotId: number | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  topicId: number | null;
  topicName: string;
  status: BookingStatus;
  meetLink: string | null;
  phone: string | null;
  notes: string | null;
  userName: string | null;
  userEmail: string;
  createdAt: string;
  cancelledAt: string | null;
  cancelledBy: "USER" | "ADMIN" | null;
  cancelReason: string | null;
  /** Fee for this booking; null = free. */
  amount: number | null;
  /** PENDING_PAYMENT only: the slot is released if no payment is submitted by then. */
  paymentDueAt: string | null;
  /** Latest payment for this booking, or null if none submitted yet. */
  paymentStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  paymentId: number | null;
  paymentRejectionReason: string | null;
  /** How many more times the user may reschedule (one reschedule per booking). */
  reschedulesLeft: number;
}

export interface BookInput {
  slotId: number;
  topicId: number;
  phone?: string;
  notes?: string;
}

/** Times are "HH:mm"; dates "YYYY-MM-DD"; weekdays 1 = Monday … 7 = Sunday. */
export interface GenerateSlotsInput {
  fromDate: string;
  toDate: string;
  weekdays: number[];
  dayStart: string;
  dayEnd: string;
  durationMinutes: number;
  breakMinutes: number;
}

export interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
  connectedAt: string | null;
}

// ─── User API ─────────────────────────────────────────────────────────────────

export const consultationApi = {
  topics: () => getJson<ConsultationTopic[]>("/api/consultations/topics"),
  slots: (days = 30) => getJson<ConsultationSlot[]>(`/api/consultations/slots?days=${days}`),
  book: (body: BookInput) => sendJson<ConsultationBooking>("POST", "/api/consultations/bookings", body),
  mine: () => getJson<ConsultationBooking[]>("/api/consultations/bookings/mine"),
  cancel: (id: number) => sendJson<ConsultationBooking>("POST", `/api/consultations/bookings/${id}/cancel`),
  reschedule: (id: number, slotId: number) =>
    sendJson<ConsultationBooking>("POST", `/api/consultations/bookings/${id}/reschedule`, { slotId }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

const ADMIN = "/api/admin/consultations";

export const consultationAdminApi = {
  topics: () => getJson<ConsultationTopic[]>(`${ADMIN}/topics`),
  createTopic: (body: TopicInput) => sendJson<ConsultationTopic>("POST", `${ADMIN}/topics`, body),
  updateTopic: (id: number, body: TopicInput) => sendJson<ConsultationTopic>("PUT", `${ADMIN}/topics/${id}`, body),
  deleteTopic: (id: number) => sendNoContent("DELETE", `${ADMIN}/topics/${id}`),

  slots: (from: string, to: string) => getJson<AdminSlot[]>(`${ADMIN}/slots?from=${from}&to=${to}`),
  generateSlots: (body: GenerateSlotsInput) =>
    sendJson<{ created: number; skipped: number }>("POST", `${ADMIN}/slots/generate`, body),
  deleteSlot: (id: number) => sendNoContent("DELETE", `${ADMIN}/slots/${id}`),

  bookings: (from: string, to: string) => getJson<ConsultationBooking[]>(`${ADMIN}/bookings?from=${from}&to=${to}`),
  cancelBooking: (id: number, reason: string) =>
    sendJson<ConsultationBooking>("POST", `${ADMIN}/bookings/${id}/cancel`, { reason: reason || null }),
  setMeetLink: (id: number, meetLink: string) =>
    sendJson<ConsultationBooking>("PUT", `${ADMIN}/bookings/${id}/meet-link`, { meetLink }),
  retryMeetLink: (id: number) => sendJson<ConsultationBooking>("POST", `${ADMIN}/bookings/${id}/meet-link/retry`),

  googleStatus: () => getJson<GoogleStatus>(`${ADMIN}/google`),
  googleAuthorizeUrl: () => getJson<{ url: string }>(`${ADMIN}/google/authorize-url`),
  disconnectGoogle: () => sendNoContent("DELETE", `${ADMIN}/google`),
};

// ─── Formatting (times are shown in the viewer's own time zone) ───────────────

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

export const formatWhen = (b: { startsAt: string; endsAt: string }) =>
  `${formatDay(b.startsAt)}, ${formatTime(b.startsAt)} – ${formatTime(b.endsAt)}`;

/** Local date as YYYY-MM-DD, `offsetDays` from today. */
export const isoDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return dayKey(d.toISOString());
};
