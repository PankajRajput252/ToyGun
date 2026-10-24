import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import ShippingStatusBadge from "../../components/payment/ShippingStatusBadge";
import OrderShippingPanel from "../../components/payment/OrderShippingPanel";
import {
  PageResponse,
  ShippingStatus,
  ShopOrder,
  adminShopOrderApi,
  errorMessage,
  formatDateTime,
  formatInr,
} from "../../services/paymentApi";

type Tab = { key: string; label: string; shippingStatus?: ShippingStatus };
const TABS: Tab[] = [
  { key: "failed", label: "Failed", shippingStatus: "FAILED" },
  { key: "manual", label: "Manual handling", shippingStatus: "MANUAL_REVIEW" },
  { key: "pickup", label: "Pickup scheduled", shippingStatus: "PICKUP_SCHEDULED" },
  { key: "all", label: "All paid orders" },
];
const PAGE_SIZE = 20;

export default function AdminShipments() {
  const [tab, setTab] = useState<Tab>(TABS[0]);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<ShopOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<ShopOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminShopOrderApi.list({ status: "PAID", shippingStatus: tab.shippingStatus, page, size: PAGE_SIZE }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Paid bank / UPI orders are sent to Shiprocket automatically. Fix and retry the ones that failed here.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm dark:bg-gray-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t);
                setPage(0);
              }}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab.key === t.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
              {tab.key === t.key && data ? ` (${data.totalElements})` : ""}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        ) : loading && !data ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : data && data.content.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-800">
            {tab.key === "failed" ? "No failed shipments. 🎉" : "No orders here."}
          </div>
        ) : data ? (
          <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Ship to</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Shipping</th>
                    <th className="px-4 py-3">AWB</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.content.map((o) => (
                    <tr key={o.orderReference} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(o.paidAt)}</td>
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{o.orderReference}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{o.shippingAddress.fullName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.shippingAddress.city} {o.shippingAddress.pincode}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatInr(o.subtotal)}</td>
                      <td className="px-4 py-3"><ShippingStatusBadge status={o.shipping.status} /></td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{o.shipping.awbCode ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setOpen(o)}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                          {o.shipping.status === "FAILED" ? "Fix / retry" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Page {data.page + 1} of {data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} aria-label="Previous page"
                  className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-40 dark:border-gray-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= data.totalPages || loading} aria-label="Next page"
                  className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-40 dark:border-gray-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {open && (
        <Modal isOpen onClose={() => { setOpen(null); load(); }} className="max-w-2xl p-5 sm:p-7">
          <h2 className="mb-4 pr-10 text-xl font-bold text-gray-900 dark:text-white">Shipment</h2>
          <OrderShippingPanel orderReference={open.orderReference} initial={open} />
        </Modal>
      )}
    </div>
  );
}
