import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { PaymentStatus } from "../../services/paymentApi";

const STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending verification",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const Icon = status === "APPROVED" ? CheckCircle2 : status === "REJECTED" ? XCircle : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {LABELS[status]}
    </span>
  );
}
