import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellOff, CalendarClock, CheckCheck, ChevronDown, ChevronUp, CreditCard, ExternalLink, LifeBuoy, Loader2, MoreHorizontal,
  Package, Star, Tag, Truck, UserPlus, Zap,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { errorMessage } from "../../services/paymentApi";
import { AppNotification, NotificationCategory, notificationApi, timeAgo } from "../../services/notificationApi";

// Admin notification list: "Only show unread", Today / Yesterday / Older sections, grouped updates and
// read dots. Used by the bell panel in the admin header and the /admin/notifications page.

const PAGE_SIZE = 30;

const CATEGORY: Record<NotificationCategory, { icon: typeof Zap; cls: string }> = {
  PAYMENT: { icon: CreditCard, cls: "text-emerald-500" },
  ORDER: { icon: Package, cls: "text-amber-500" },
  SHIPPING: { icon: Truck, cls: "text-sky-500" },
  CONSULTATION: { icon: CalendarClock, cls: "text-violet-500" },
  USER: { icon: UserPlus, cls: "text-pink-500" },
  LISTING: { icon: Tag, cls: "text-orange-500" },
  SUPPORT: { icon: LifeBuoy, cls: "text-red-500" },
  REVIEW: { icon: Star, cls: "text-yellow-500" },
  SYSTEM: { icon: Zap, cls: "text-gray-400" },
};

const AVATAR_COLORS = ["bg-slate-700", "bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600", "bg-cyan-700"];

/** Notifications about the same thing, newest first; shown as one row with "+N updates". */
interface Group {
  key: string;
  items: AppNotification[];
}

export default function NotificationFeed({ variant, onNavigate }: { variant: "panel" | "page"; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { unread, refreshCounts, onNotification } = useNotifications();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await notificationApi.list(unreadOnly, p, PAGE_SIZE);
        setItems((prev) => (p === 0 ? res.content : [...prev, ...res.content.filter((n) => !prev.some((x) => x.id === n.id))]));
        setPage(p);
        setHasMore(p + 1 < res.totalPages);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [unreadOnly]
  );

  useEffect(() => {
    load(0);
  }, [load]);

  // New notifications appear at the top while the list is open
  useEffect(
    () => onNotification((n) => setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]))),
    [onNotification]
  );

  // Keep "5 minutes ago" fresh
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const groups = useMemo(() => {
    const byKey = new Map<string, Group>();
    const order: Group[] = [];
    for (const n of items) {
      const key = n.groupKey ? `g:${n.groupKey}` : `n:${n.id}`;
      let g = byKey.get(key);
      if (!g) {
        g = { key, items: [] };
        byKey.set(key, g);
        order.push(g);
      }
      g.items.push(n);
    }
    return order;
  }, [items]);

  const sections = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = startOfToday.getTime();
    const yesterday = today - 86_400_000;
    const out: { title: string; groups: Group[] }[] = [
      { title: "Today", groups: [] },
      { title: "Yesterday", groups: [] },
      { title: "Older", groups: [] },
    ];
    for (const g of groups) {
      const t = new Date(g.items[0].createdAt).getTime();
      out[t >= today ? 0 : t >= yesterday ? 1 : 2].groups.push(g);
    }
    return out.filter((s) => s.groups.length > 0);
  }, [groups]);

  /** Marks a whole group read/unread (the server applies it to every item with the same key). */
  const setGroupRead = async (g: Group, read: boolean) => {
    const ids = new Set(g.items.map((n) => n.id));
    setItems((prev) => prev.map((n) => (ids.has(n.id) ? { ...n, read } : n)));
    try {
      await notificationApi.setRead(g.items[0].id, read);
    } catch {
      /* the list is refreshed below either way */
    }
    refreshCounts();
  };

  const open = (g: Group) => {
    if (g.items.some((n) => !n.read)) setGroupRead(g, true);
    const link = g.items[0].link;
    if (link) {
      onNavigate?.();
      navigate(link);
    }
  };

  const markAllRead = async () => {
    setMenuOpen(false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationApi.readAll();
    } finally {
      refreshCounts();
      if (unreadOnly) load(0);
    }
  };


  return (
    <div className={`flex min-h-0 flex-col ${variant === "panel" ? "h-full" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 className={`font-bold text-gray-900 dark:text-white ${variant === "panel" ? "text-xl" : "text-2xl"}`}>Notifications</h2>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="hidden sm:inline">Only show unread</span>
            <span className="sm:hidden">Unread</span>
            <button
              role="switch"
              aria-checked={unreadOnly}
              onClick={() => setUnreadOnly((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition ${unreadOnly ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${unreadOnly ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </label>
          {variant === "panel" && (
            <button
              onClick={() => {
                onNavigate?.();
                navigate("/admin/notifications");
              }}
              title="Open all notifications"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More actions"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <MoreHorizontal className="h-5 w-5 rotate-90" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={markAllRead}
                  disabled={unread === 0}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <CheckCheck className="h-4 w-4" /> Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 border-b border-gray-200 dark:border-gray-700" />

      {/* List */}
      <div className={`${variant === "panel" ? "min-h-0 flex-1 overflow-y-auto" : ""} px-2 pb-3`}>
        {error ? (
          <p className="m-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>
        ) : loading && items.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <BellOff className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 font-semibold text-gray-800 dark:text-gray-100">{unreadOnly ? "You're all caught up" : "No notifications yet"}</p>
            <p className="mt-1 text-sm text-gray-500">
              New orders, payments, consultation bookings, sign-ups, listings and support tickets show up here.
            </p>
          </div>
        ) : (
          <>
            {sections.map((s) => (
              <div key={s.title}>
                <p className="px-3 pb-1 pt-4 text-xs font-semibold text-gray-600 dark:text-gray-400">{s.title}</p>
                <ul>
                  {s.groups.map((g) => (
                    <NotificationRow key={g.key} group={g} now={now} onOpen={() => open(g)} onToggleRead={(read) => setGroupRead(g, read)} />
                  ))}
                </ul>
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center py-3">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />} Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ group, now, onOpen, onToggleRead }: {
  group: Group; now: number; onOpen: () => void; onToggleRead: (read: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const latest = group.items[0];
  const older = group.items.slice(1);
  const unread = group.items.some((n) => !n.read);

  return (
    <li className="group/row relative rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
        className="flex cursor-pointer gap-3 px-3 py-3 pr-9"
      >
        <Avatar name={latest.actorName} category={latest.category} />
        <div className="min-w-0 flex-1">
          <NotificationText n={latest} now={now} />
          {older.length > 0 && (
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                <span className="flex -space-x-1.5">
                  {uniqueActors(older).slice(0, 3).map((a) => (
                    <Avatar key={a ?? "system"} name={a} category={latest.category} small />
                  ))}
                </span>
                +{older.length} update{older.length === 1 ? "" : "s"} from {actorsText(older)}
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {expanded && (
                <ul className="mt-2 space-y-2 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                  {older.map((n) => (
                    <li key={n.id}>
                      <NotificationText n={n} now={now} compact />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => onToggleRead(unread)}
        title={unread ? "Mark as read" : "Mark as unread"}
        aria-label={unread ? "Mark as read" : "Mark as unread"}
        className="absolute right-2 top-4 flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full transition ${
            unread ? "bg-blue-600" : "border border-gray-400 opacity-0 group-hover/row:opacity-100"
          }`}
        />
      </button>
    </li>
  );
}

function NotificationText({ n, now, compact }: { n: AppNotification; now: number; compact?: boolean }) {
  const { icon: Icon, cls } = CATEGORY[n.category] ?? CATEGORY.SYSTEM;
  return (
    <div className="min-w-0 text-sm">
      <p className="text-gray-800 dark:text-gray-200">
        <span className="font-semibold text-gray-900 dark:text-white">{n.actorName ?? "Bandookwale"}</span> {n.action}{" "}
        <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">{timeAgo(n.createdAt, now)}</span>
      </p>
      <p className={`mt-0.5 flex items-start gap-1.5 text-gray-800 dark:text-gray-200 ${compact ? "text-xs" : ""}`}>
        <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${cls}`} />
        <span className="line-clamp-2">{n.title}</span>
      </p>
      {(n.reference || n.status) && !compact && (
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {n.reference}
          {n.reference && n.status && " • "}
          {n.status && <span className="normal-case tracking-normal">{n.status}</span>}
        </p>
      )}
    </div>
  );
}

function Avatar({ name, category, small }: { name: string | null; category: NotificationCategory; small?: boolean }) {
  const size = small ? "h-6 w-6 text-[10px] ring-2 ring-white dark:ring-gray-900" : "h-10 w-10 text-sm";
  if (!name) {
    const { icon: Icon } = CATEGORY[category] ?? CATEGORY.SYSTEM;
    return (
      <span className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-amber-400 dark:bg-gray-700 ${size}`}>
        <Icon className={small ? "h-3 w-3" : "h-5 w-5"} />
      </span>
    );
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const color = AVATAR_COLORS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_COLORS.length];
  return (
    <span className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white ${color} ${size}`} title={name}>
      {initials || "?"}
    </span>
  );
}

const uniqueActors = (list: AppNotification[]) => [...new Set(list.map((n) => n.actorName))];

function actorsText(list: AppNotification[]) {
  const names = uniqueActors(list).map((a) => a ?? "Bandookwale");
  return names.length === 1 ? names[0] : `${names[0]} and others`;
}
