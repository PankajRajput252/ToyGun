import { AlertTriangle, CheckCircle2, Clock, Loader2, PackageCheck, ShieldAlert, Truck } from "lucide-react";
import type { ShippingStatus } from "../../services/paymentApi";

const STYLES: Record<ShippingStatus, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  MANUAL_REVIEW: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  ORDER_CREATED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  AWB_ASSIGNED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  PICKUP_SCHEDULED: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

/** Admin wording: exact Shiprocket step. */
const ADMIN_LABELS: Record<ShippingStatus, string> = {
  NOT_STARTED: "Not shipped",
  MANUAL_REVIEW: "Manual handling",
  PROCESSING: "Creating shipment…",
  ORDER_CREATED: "Shiprocket order created",
  AWB_ASSIGNED: "Courier assigned",
  PICKUP_SCHEDULED: "Pickup scheduled",
  FAILED: "Shiprocket failed",
};

/** Buyer wording: no internal details. */
const BUYER_LABELS: Record<ShippingStatus, string> = {
  NOT_STARTED: "Awaiting payment",
  MANUAL_REVIEW: "Seller will arrange delivery",
  PROCESSING: "Preparing shipment",
  ORDER_CREATED: "Preparing shipment",
  AWB_ASSIGNED: "Courier assigned",
  PICKUP_SCHEDULED: "Ready for pickup",
  FAILED: "Preparing shipment",
};

const ICONS: Record<ShippingStatus, typeof Truck> = {
  NOT_STARTED: Clock,
  MANUAL_REVIEW: ShieldAlert,
  PROCESSING: Loader2,
  ORDER_CREATED: PackageCheck,
  AWB_ASSIGNED: Truck,
  PICKUP_SCHEDULED: CheckCircle2,
  FAILED: AlertTriangle,
};

export default function ShippingStatusBadge({ status, audience = "admin" }: { status: ShippingStatus; audience?: "admin" | "buyer" }) {
  // Buyers never see "failed": the team retries it, so show it as still being prepared
  const shown: ShippingStatus = audience === "buyer" && status === "FAILED" ? "PROCESSING" : status;
  const Icon = ICONS[shown];
  const label = (audience === "buyer" ? BUYER_LABELS : ADMIN_LABELS)[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[shown]}`}>
      <Icon className={`h-3.5 w-3.5 ${shown === "PROCESSING" ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}
