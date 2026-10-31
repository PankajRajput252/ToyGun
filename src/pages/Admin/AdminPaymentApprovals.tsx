import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import PaymentStatusBadge from "../../components/payment/PaymentStatusBadge";
import { ReceiptPreview } from "../../components/payment/AuthFilePreview";
import OrderShippingPanel from "../../components/payment/OrderShippingPanel";
import { useToast } from "../../context/ToastContext";
import {
  PageResponse,
  PaymentApiError,
  PaymentStatus,
  PaymentSubmission,
  adminShopOrderApi,
  errorMessage,
  formatDateTime,
  formatInr,
  paymentAdminApi,
} from "../../services/paymentApi";

type Tab = PaymentStatus | "ALL";
const TABS: { key: Tab; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];
const PAGE_SIZE = 20;

export default function AdminPaymentApprovals() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<PaymentSubmission> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<PaymentSubmission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await paymentAdminApi.listPayments({
          status: tab === "ALL" ? undefined : tab,
          page,
          size: PAGE_SIZE,
          // Oldest first for the queue so nothing waits too long; newest first elsewhere
          sort: tab === "PENDING" ? "createdAt,asc" : "createdAt,desc",
        })
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  const onReviewed = (updated: PaymentSubmission) => {
    if (updated.status === "APPROVED" && updated.orderReference) {
      // Keep the dialog open so the admin can watch the Shiprocket order being placed
      setReviewing(updated);
      showToast("Payment approved — placing the Shiprocket order");
    } else {
      setReviewing(null);
      showToast(updated.status === "APPROVED" ? "Payment approved" : "Payment rejected", updated.status === "APPROVED" ? "success" : "info");
    }
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Approvals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Check each receipt against your bank statement, then approve or reject.</p>
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
                setTab(t.key);
                setPage(0);
              }}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
              {tab === t.key && data ? ` (${data.totalElements})` : ""}
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
            {tab === "PENDING" ? "No payments waiting for review." : "No payments here."}
          </div>
        ) : data ? (
          <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.content.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{formatDateTime(p.submittedAt)}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{p.userId}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatInr(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.paymentMethodName}</td>
                      <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">{p.transactionReference}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.orderReference ?? "—"}</td>
                      <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setReviewing(p)}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                          {p.status === "PENDING" ? "Review" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>
                  Page {data.page + 1} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  aria-label="Previous page"
                  className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= data.totalPages || loading}
                  aria-label="Next page"
                  className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {reviewing && (
        <ReviewModal
          payment={reviewing}
          onClose={() => setReviewing(null)}
          onReviewed={onReviewed}
          onStale={() => {
            setReviewing(null);
            showToast("This payment was already reviewed — list refreshed", "info");
            load();
          }}
        />
      )}
    </div>
  );
}

// ─── Review dialog ────────────────────────────────────────────────────────────

const MIN_REASON = 10;
const MAX_REASON = 500;
const QUICK_REASONS = [
  "Amount in the receipt does not match the amount entered.",
  "Payment not received in our account for this reference number.",
  "Receipt is unclear or unreadable. Please upload a clearer screenshot.",
];

function ReviewModal({
  payment,
  onClose,
  onReviewed,
  onStale,
}: {
  payment: PaymentSubmission;
  onClose: () => void;
  onReviewed: (p: PaymentSubmission) => void;
  onStale: () => void;
}) {
  const [mode, setMode] = useState<"view" | "reject">("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPending = payment.status === "PENDING";
  const reasonLen = reason.trim().length;
  // Products the payment was made for — taken from the linked order and sent with the receipt request
  const [productIds, setProductIds] = useState<number[]>([]);
  const [productLoading, setProductLoading] = useState(!!payment.orderReference);

  useEffect(() => {
    if (!payment.orderReference) return;
    let cancelled = false;
    adminShopOrderApi
      .get(payment.orderReference)
      .then((order) => !cancelled && setProductIds([...new Set(order.items.map((i) => i.productId))]))
      .catch(() => {}) // receipt still loads without productIds
      .finally(() => !cancelled && setProductLoading(false));
    return () => {
      cancelled = true;
    };
  }, [payment.orderReference]);

  const act = async (action: "approve" | "reject") => {
    setBusy(action);
    setError(null);
    try {
      const updated =
        action === "approve"
          ? await paymentAdminApi.approve(payment.id, productIds)
          : await paymentAdminApi.reject(payment.id, reason, productIds);
      onReviewed(updated);
    } catch (err) {
      if (err instanceof PaymentApiError && err.status === 409) return onStale();
      setError(err instanceof PaymentApiError && err.fieldErrors.reason ? err.fieldErrors.reason : errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal isOpen onClose={busy ? () => {} : onClose} className="max-w-3xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3 pr-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment #{payment.id}</h2>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-3 text-sm">
          <Item label="Amount" value={<span className="text-lg font-bold">{formatInr(payment.amount)}</span>} wide />
          <Item label="Customer" value={payment.userId} />
          <Item label="Method" value={payment.paymentMethodName} />
          <Item label="UTR / reference" value={<span className="font-mono">{payment.transactionReference}</span>} />
          <Item label="Paid on" value={payment.paymentDate} />
          <Item label="Order" value={payment.orderReference ?? "—"} />
          <Item label="Submitted" value={formatDateTime(payment.submittedAt)} />
          {payment.remarks && <Item label="Customer note" value={payment.remarks} wide />}
          {payment.reviewedAt && (
            <Item label="Reviewed" value={`${payment.reviewedBy ?? ""} · ${formatDateTime(payment.reviewedAt)}`} wide />
          )}
          {payment.rejectionReason && (
            <Item label="Rejection reason" value={<span className="text-red-600">{payment.rejectionReason}</span>} wide />
          )}
        </dl>
        {productLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <ReceiptPreview path={payment.receiptUrl} fileName={payment.receiptFileName} productIds={productIds} />
        )}
      </div>

      {payment.orderReference && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Order &amp; shipping{" "}
            {isPending && <span className="font-normal text-gray-500">— approving places this order with Shiprocket automatically</span>}
          </h3>
          {/* key: remount after approval so the panel reloads and follows the background shipment */}
          <OrderShippingPanel key={`${payment.orderReference}-${payment.status}`} orderReference={payment.orderReference} />
        </div>
      )}

      {isPending && mode === "reject" && (
        <div className="mt-6">
          <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200" htmlFor="reject-reason">
            Reason for rejection <span className="font-normal text-gray-500">(the customer will see this)</span>
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={MAX_REASON}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <p className={`mt-1 text-right text-xs ${reasonLen > 0 && reasonLen < MIN_REASON ? "text-red-500" : "text-gray-500"}`}>
            {reasonLen < MIN_REASON ? `At least ${MIN_REASON} characters` : `${reasonLen}/${MAX_REASON}`}
          </p>
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          onClick={mode === "reject" ? () => setMode("view") : onClose}
          disabled={!!busy}
          className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        >
          {mode === "reject" ? "Back" : "Close"}
        </button>
        {isPending && mode === "view" && (
          <>
            <button
              onClick={() => setMode("reject")}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button
              onClick={() => act("approve")}
              disabled={!!busy || productLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve
            </button>
          </>
        )}
        {isPending && mode === "reject" && (
          <button
            onClick={() => act("reject")}
            disabled={!!busy || productLoading || reasonLen < MIN_REASON}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy === "reject" && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm rejection
          </button>
        )}
      </div>
    </Modal>
  );
}

function Item({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="break-words text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}
