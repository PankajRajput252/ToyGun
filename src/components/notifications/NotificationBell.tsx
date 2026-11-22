import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import NotificationFeed from "./NotificationFeed";

/** Admin header bell with the unread badge; opens the notifications panel. */
export default function NotificationBell({ className = "" }: { className?: string }) {
  const { unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative text-white transition duration-200 hover:scale-110 hover:text-amber-400"
      >
        <Bell className="h-7 w-7 drop-shadow-md lg:h-8 lg:w-8" strokeWidth={2.5} />
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white shadow">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-x-2 top-16 z-[9999] flex h-[min(640px,calc(100vh-5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-2xl
                     dark:border-gray-700 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[440px]"
        >
          <NotificationFeed variant="panel" onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
