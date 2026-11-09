// Website visitor counter: one ping per browser session; admin reads the stats.
import { API_BASE_URL } from "./apiBase";
import { getJson } from "./paymentApi";

export interface VisitTotals {
  visitors: number; // distinct browsers
  visits: number; // browser sessions
  loggedInVisitors: number; // distinct logged-in users
}

export interface VisitDay {
  date: string; // YYYY-MM-DD (IST)
  visitors: number;
  visits: number;
}

export interface VisitStats {
  today: VisitTotals;
  yesterday: VisitTotals;
  last7Days: VisitTotals;
  last30Days: VisitTotals;
  allTime: VisitTotals;
  daily: VisitDay[];
}

const VISITOR_KEY = "bw_visitor_id";
const SESSION_KEY = "bw_visit_recorded";

function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode): still count this load, just not as a returning visitor
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export const visitApi = {
  /** Records this browser session once. No auth header: guests are counted too. */
  recordOnce: (userId?: string | null) => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* no sessionStorage: send anyway */
    }
    fetch(`${API_BASE_URL}/api/site-visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: visitorId(), userId: userId || null }),
      keepalive: true,
    }).catch(() => {
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    });
  },

  stats: (days = 30) => getJson<VisitStats>(`/api/admin/site-visits/stats?days=${days}`),
};
