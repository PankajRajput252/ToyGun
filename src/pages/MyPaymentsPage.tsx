import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Building2, Loader2, QrCode, ReceiptText, RefreshCw } from "lucide-react";
import {
  PaymentSubmission,
  errorMessage,
  formatDateTime,
  formatInr,
  paymentUserApi,
} from "../services/paymentApi";
import PaymentStatusBadge from "../components/payment/PaymentStatusBadge";
import { ReceiptPreview } from "../components/payment/AuthFilePreview";
import ManualPaymentModal from "../components/payment/ManualPaymentModal";
import { useToast } from "../context/ToastContext";

export default function MyPaymentsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReceiptId, setOpenReceiptId] = useState<number | null>(null);
  const [resubmitFor, setResubmitFor] = useState<PaymentSubmission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(await paymentUserApi.myPayments());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Refresh when the user comes back to the tab, so admin decisions show up
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-2xl font-bold text-gray-900 dark:text-white">My Payments</h1>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {loading && payments.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
            <ReceiptText className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-semibold text-gray-800 dark:text-white">No payments yet</p>
            <p className="mt-1 text-sm text-gray-500">Payments you make by bank transfer or UPI will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {payments.map((p) => {
              const Icon = p.paymentMethodType === "QR_CODE" ? QrCode : Building2;
              return (
                <li key={p.id} className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatInr(p.amount)}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          via {p.paymentMethodName} · submitted {formatDateTime(p.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <PaymentStatusBadge status={p.status} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-gray-500">Reference no.</dt>
                      <dd className="break-all font-mono text-gray-900 dark:text-gray-100">{p.transactionReference}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Paid on</dt>
                      <dd className="text-gray-900 dark:text-gray-100">{p.paymentDate}</dd>
                    </div>
                    {p.orderReference && (
                      <div>
                        <dt className="text-xs text-gray-500">Order</dt>
                        <dd className="break-all text-gray-900 dark:text-gray-100">{p.orderReference}</dd>
                      </div>
                    )}
                  </dl>

                  {p.status === "REJECTED" && p.rejectionReason && (
                    <div className="mt-4 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Reason for rejection</p>
                        <p>{p.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                  {p.status === "PENDING" && (
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      We're verifying this payment. This usually takes a few hours.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setOpenReceiptId(openReceiptId === p.id ? null : p.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {openReceiptId === p.id ? "Hide receipt" : "View receipt"}
                    </button>
                    {p.status === "REJECTED" && (
                      <button
                        onClick={() => setResubmitFor(p)}
                        className="rounded-lg bg-gradient-to-r from-black to-yellow-500 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Submit again
                      </button>
                    )}
                  </div>

                  {openReceiptId === p.id && (
                    <div className="mt-4">
                      <ReceiptPreview path={p.receiptUrl} fileName={p.receiptFileName} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ManualPaymentModal
        isOpen={resubmitFor !== null}
        onClose={() => setResubmitFor(null)}
        amount={resubmitFor?.amount}
        orderReference={resubmitFor?.orderReference ?? undefined}
        onSubmitted={() => {
          setResubmitFor(null);
          showToast("Payment submitted for verification");
          load();
        }}
      />
    </div>
  );
}
