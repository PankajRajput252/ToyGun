import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin, RefreshCw, Truck } from "lucide-react";
import ShippingStatusBadge from "./ShippingStatusBadge";
import {
  PaymentApiError,
  ShopOrder,
  adminShopOrderApi,
  errorMessage,
  formatDateTime,
  formatInr,
} from "../../services/paymentApi";

/**
 * Admin view of an order: items, delivery address and the Shiprocket status, with a Retry button.
 * Polls while the shipment is being created in the background.
 */
export default function OrderShippingPanel({
  orderReference,
  initial,
  onChanged,
}: {
  orderReference: string;
  initial?: ShopOrder;
  onChanged?: (o: ShopOrder) => void;
}) {
  const [order, setOrder] = useState<ShopOrder | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  // Keep the latest callback without making `load` change identity (avoids a fetch loop)
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const load = useCallback(async () => {
    try {
      const o = await adminShopOrderApi.get(orderReference);
      setOrder(o);
      setError(null);
      onChangedRef.current?.(o);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [orderReference]);

  useEffect(() => {
    if (!initial) load();
  }, [load, initial]);

  // Auto-ship runs in the background after approval: poll briefly until it settles
  const inFlight =
    order?.status === "PAID" && (order.shipping.status === "NOT_STARTED" || order.shipping.status === "PROCESSING");
  useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(load, 3000);
    const stop = setTimeout(() => clearInterval(t), 60000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [inFlight, load]);

  const retry = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      const o = await adminShopOrderApi.ship(orderReference);
      setOrder(o);
      onChangedRef.current?.(o);
      if (o.shipping.status === "FAILED") setRetryError(o.shipping.error ?? "Shiprocket failed again.");
    } catch (err) {
      setRetryError(errorMessage(err));
      if (err instanceof PaymentApiError && err.status === 409) load();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error || !order) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">Order {orderReference}: {error}</p>;
  }

  const s = order.shipping;
  const a = order.shippingAddress;
  const canRetry =
    order.status === "PAID" && (s.status === "FAILED" || s.status === "NOT_STARTED" || s.status === "ORDER_CREATED" || s.status === "AWB_ASSIGNED");

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-gray-900 dark:text-white">Order {order.orderReference}</span>
        </div>
        <ShippingStatusBadge status={s.status} />
      </div>

      <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-700">
        {order.items.map((i) => (
          <li key={i.productId} className="flex justify-between gap-3 py-1.5">
            <span className="text-gray-800 dark:text-gray-200">
              {i.productName} × {i.units}
              {i.licenceRequired && <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700">Licence</span>}
              {!i.storeProduct && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">Other seller</span>}
            </span>
            <span className="whitespace-nowrap text-gray-600 dark:text-gray-400">{formatInr(i.unitPrice * i.units)}</span>
          </li>
        ))}
        <li className="flex justify-between py-1.5 font-semibold text-gray-900 dark:text-white">
          <span>Total</span>
          <span>{formatInr(order.subtotal)}</span>
        </li>
      </ul>

      <div className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p>
          {a.fullName} · {a.phone}
          <br />
          {a.addressLine1}
          {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city}, {a.state} {a.pincode}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-900 dark:text-gray-100">
        <div><dt className="text-xs text-gray-500 dark:text-gray-400">Shiprocket order</dt><dd className="font-mono">{s.shiprocketOrderId ?? "—"}</dd></div>
        <div><dt className="text-xs text-gray-500 dark:text-gray-400">Shipment</dt><dd className="font-mono">{s.shiprocketShipmentId ?? "—"}</dd></div>
        <div><dt className="text-xs text-gray-500 dark:text-gray-400">Courier</dt><dd>{s.courierName ?? "—"}</dd></div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">AWB</dt>
          <dd className="font-mono">
            {s.awbCode ? (
              <a href={s.trackingUrl ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold-600 hover:underline">
                {s.awbCode} <ExternalLink className="h-3 w-3" />
              </a>
            ) : "—"}
          </dd>
        </div>
        {s.pickupScheduledDate && <div><dt className="text-xs text-gray-500 dark:text-gray-400">Pickup</dt><dd>{s.pickupScheduledDate}</dd></div>}
        {s.lastAttemptAt && <div><dt className="text-xs text-gray-500 dark:text-gray-400">Last attempt</dt><dd>{formatDateTime(s.lastAttemptAt)} ({s.attempts})</dd></div>}
      </dl>

      {s.error && (
        <p className={`whitespace-pre-wrap break-words rounded-lg p-3 text-sm ${s.status === "MANUAL_REVIEW" ? "bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>
          {s.error}
        </p>
      )}
      {inFlight && <p className="text-xs text-gray-500">Creating the Shiprocket shipment in the background…</p>}
      {retryError && retryError !== s.error && (
        <p className="whitespace-pre-wrap break-words rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{retryError}</p>
      )}

      {canRetry && (
        <button
          onClick={retry}
          disabled={retrying}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {s.status === "NOT_STARTED" ? "Create Shiprocket order now" : s.status === "FAILED" ? "Retry Shiprocket" : "Continue Shiprocket steps"}
        </button>
      )}
    </div>
  );
}
