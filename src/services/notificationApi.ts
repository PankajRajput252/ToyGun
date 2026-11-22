// Admin notifications (bell in the admin header): new orders, payments, bookings, sign-ups, listings…
// Backend: com.gunwala.notification.NotificationController. Customers don't get these.
// Live updates arrive over STOMP on /topic/notifications/{nodeId} (see NotificationContext).

import { PageResponse, getJson, sendJson, sendNoContent } from "./paymentApi";

export type NotificationCategory =
  | "PAYMENT" | "ORDER" | "SHIPPING" | "CONSULTATION" | "USER" | "LISTING" | "SUPPORT" | "REVIEW" | "SYSTEM";

export interface AppNotification {
  id: number;
  category: NotificationCategory;
  /** Who did it; null = the system ("Bandookwale"). */
  actorName: string | null;
  /** Follows the actor's name, e.g. "placed an order". */
  action: string;
  title: string;
  reference: string | null;
  status: string | null;
  /** Admin page to open on click. */
  link: string | null;
  /** Updates about the same order / booking share a key and are grouped. */
  groupKey: string | null;
  read: boolean;
  createdAt: string;
}

const BASE = "/api/admin/notifications";

export const notificationApi = {
  list: (unreadOnly: boolean, page = 0, size = 30) =>
    getJson<PageResponse<AppNotification>>(`${BASE}?unreadOnly=${unreadOnly}&page=${page}&size=${size}`),
  unreadCount: () => getJson<{ count: number }>(`${BASE}/unread-count`),
  /** Applies to the whole group the notification belongs to. */
  setRead: (id: number, read: boolean) => sendNoContent("POST", `${BASE}/${id}/${read ? "read" : "unread"}`),
  readAll: () => sendJson<{ updated: number }>("POST", `${BASE}/read-all`),
};

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago", or a date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
