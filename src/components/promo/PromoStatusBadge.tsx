import type { PromoStatus } from "../../services/promoApi";

const STYLES: Record<PromoStatus, { label: string; cls: string }> = {
  ACTIVE: { label: "Live", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" },
  SCHEDULED: { label: "Scheduled", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  EXPIRED: { label: "Expired", cls: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  USED_UP: { label: "Used up", cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" },
  INACTIVE: { label: "Paused", cls: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
};

export default function PromoStatusBadge({ status }: { status: PromoStatus }) {
  const s = STYLES[status];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}
