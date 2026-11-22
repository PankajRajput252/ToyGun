import NotificationFeed from "../components/notifications/NotificationFeed";

/** All notifications, full page (opened from the bell panel's "open" icon). */
export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-950 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <NotificationFeed variant="page" />
      </div>
    </div>
  );
}
