import { FormEvent, useEffect, useState } from "react";
import { Building2, Loader2, QrCode, Upload, X } from "lucide-react";
import { Modal } from "../ui/modal";
import {
  PaymentMethod,
  PaymentSubmission,
  PaymentApiError,
  RECEIPT_TYPES,
  TXN_REF_PATTERN,
  checkFile,
  errorMessage,
  formatInr,
  paymentUserApi,
  todayIso,
} from "../../services/paymentApi";
import PaymentMethodDetails from "./PaymentMethodDetails";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Amount to pay. When given (cart checkout) it is fixed; otherwise the user types it. */
  amount?: number;
  /** Order id this payment is for, stored with the payment so admins can match it. */
  orderReference?: string;
  onSubmitted: (payment: PaymentSubmission) => void;
}

type FieldErrors = Partial<Record<"paymentMethodId" | "amount" | "transactionReference" | "paymentDate" | "remarks" | "receipt", string>>;

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function ManualPaymentModal({ isOpen, onClose, amount, orderReference, onSubmitted }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amountText, setAmountText] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [remarks, setRemarks] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Reset and load methods every time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setAmountText(amount !== undefined ? amount.toFixed(2) : "");
    setTxnRef("");
    setPaymentDate(todayIso());
    setRemarks("");
    setReceipt(null);
    setErrors({});
    setFormError(null);
    setLoadError(null);
    setLoadingMethods(true);
    paymentUserApi
      .listMethods()
      .then((list) => {
        setMethods(list);
        setSelectedId(list.length === 1 ? list[0].id : null);
      })
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoadingMethods(false));
  }, [isOpen, amount]);

  const selected = methods.find((m) => m.id === selectedId) ?? null;
  const amountNumber = Number(amountText);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!selected) e.paymentMethodId = "Choose how you paid.";
    if (!amountText || Number.isNaN(amountNumber) || amountNumber < 1) e.amount = "Enter an amount of at least ₹1.";
    else if (!/^\d{1,10}(\.\d{1,2})?$/.test(amountText)) e.amount = "Use up to 2 decimal places.";
    if (!txnRef.trim()) e.transactionReference = "Enter the UTR / UPI reference number.";
    else if (!TXN_REF_PATTERN.test(txnRef.trim())) e.transactionReference = "Only letters, digits and hyphens.";
    else if (txnRef.trim().length > 50) e.transactionReference = "Maximum 50 characters.";
    if (!paymentDate) e.paymentDate = "Choose the payment date.";
    else if (paymentDate > todayIso()) e.paymentDate = "Date can't be in the future.";
    if (remarks.length > 500) e.remarks = "Maximum 500 characters.";
    const fileError = checkFile(receipt, RECEIPT_TYPES);
    if (fileError) e.receipt = receipt ? fileError : "Upload a screenshot or PDF of the payment.";
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length > 0 || !selected || !receipt) return;

    setSubmitting(true);
    try {
      const payment = await paymentUserApi.submitPayment({
        paymentMethodId: selected.id,
        amount: amountNumber.toFixed(2),
        transactionReference: txnRef,
        paymentDate,
        remarks,
        orderReference,
        receipt,
      });
      onSubmitted(payment);
    } catch (err) {
      if (err instanceof PaymentApiError) {
        setErrors(err.fieldErrors as FieldErrors);
        if (err.status === 400 && /not available/i.test(err.message)) {
          // Method was disabled after the modal opened: refresh the list
          paymentUserApi.listMethods().then(setMethods).catch(() => {});
          setSelectedId(null);
        }
      }
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={submitting ? () => {} : onClose} className="max-w-xl p-5 sm:p-7" showCloseButton={!submitting}>
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="pr-10 text-xl font-bold text-gray-900 dark:text-white">Pay by bank transfer or UPI</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pay using one of the options below, then upload your receipt. We'll confirm your order once the payment is verified.
        </p>

        {amount !== undefined && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-yellow-50 px-4 py-3 dark:bg-yellow-500/10">
            <span className="text-sm text-gray-700 dark:text-gray-300">Amount to pay</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatInr(amount)}</span>
          </div>
        )}

        {/* Step 1: choose method */}
        <h3 className="mt-6 text-sm font-semibold text-gray-800 dark:text-gray-200">1. Choose a payment option</h3>
        {loadingMethods ? (
          <div className="mt-3 flex h-20 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : loadError ? (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{loadError}</p>
        ) : methods.length === 0 ? (
          <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            No payment options are available right now. Please contact support.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment option">
            {methods.map((m) => {
              const active = m.id === selectedId;
              const Icon = m.type === "QR_CODE" ? QrCode : Building2;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition ${
                    active
                      ? "border-gold-500 bg-yellow-50 dark:bg-yellow-500/10"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className={`h-6 w-6 shrink-0 ${active ? "text-gold-600" : "text-gray-500"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{m.displayName}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {m.type === "QR_CODE" ? "UPI / QR code" : `Bank transfer · ${m.bankName ?? ""}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {errors.paymentMethodId && <p className="mt-1 text-xs text-red-500">{errors.paymentMethodId}</p>}

        {selected && (
          <div className="mt-3">
            <PaymentMethodDetails method={selected} amount={amount} />
          </div>
        )}

        {/* Step 2: payment details + receipt */}
        <h3 className="mt-6 text-sm font-semibold text-gray-800 dark:text-gray-200">2. Enter payment details</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {amount === undefined && (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Amount paid (₹)</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                className={inputCls}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">UTR / UPI reference no.</span>
            <input
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="e.g. 429815673412"
              maxLength={50}
              autoComplete="off"
              className={inputCls}
            />
            {errors.transactionReference && <p className="mt-1 text-xs text-red-500">{errors.transactionReference}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Payment date</span>
            <input type="date" value={paymentDate} max={todayIso()} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
            {errors.paymentDate && <p className="mt-1 text-xs text-red-500">{errors.paymentDate}</p>}
          </label>

          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Payment receipt / screenshot</span>
            {receipt ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 px-3 py-2.5 dark:border-gray-700">
                <span className="truncate text-sm text-gray-800 dark:text-gray-200">{receipt.name}</span>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  aria-label="Remove file"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-300 px-3 py-5 text-center hover:border-gold-500 dark:border-gray-700">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload</span>
                <span className="text-xs text-gray-500">PNG, JPG or PDF · max 5 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setReceipt(f);
                    setErrors((prev) => ({ ...prev, receipt: f ? checkFile(f, RECEIPT_TYPES) ?? undefined : undefined }));
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {errors.receipt && <p className="mt-1 text-xs text-red-500">{errors.receipt}</p>}
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Note (optional)</span>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={500} className={inputCls} />
            {errors.remarks && <p className="mt-1 text-xs text-red-500">{errors.remarks}</p>}
          </label>
        </div>

        {formError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{formError}</p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || methods.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-black to-yellow-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
