import { useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import { Modal } from "../ui/modal";
import letterhead from "../images/invoice-letterhead.jpg";
import { PaymentSubmission, ShopOrder, formatInr, shopOrderApi } from "../../services/paymentApi";
import { downloadInvoicePdf, invoiceLines, invoiceNumber } from "./invoicePdf";

interface Props {
  /** An APPROVED payment; the modal is closed when null. */
  payment: PaymentSubmission | null;
  onClose: () => void;
}

/** Invoice for a verified payment, drawn on the company letterhead, with a PDF download. */
export default function InvoiceModal({ payment, onClose }: Props) {
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [issuedAt, setIssuedAt] = useState(() => new Date());

  useEffect(() => {
    if (!payment) return;
    setIssuedAt(new Date());
    setOrder(null);
    if (!payment.orderReference) return;
    setLoading(true);
    shopOrderApi
      .get(payment.orderReference)
      .then(setOrder)
      .catch(() => setOrder(null)) // fall back to a single "payment" line
      .finally(() => setLoading(false));
  }, [payment]);

  if (!payment) return null;

  const lines = invoiceLines(payment, order);
  const a = order?.shippingAddress;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePdf(payment, order, issuedAt);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} showCloseButton={false} className="max-w-2xl p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invoice {invoiceNumber(payment)}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            disabled={downloading || loading}
            aria-label="Download invoice"
            title="Download invoice (PDF)"
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Letterhead page (1110 x 1600) with the invoice laid over its blank area */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white bg-cover bg-top text-gray-900"
        style={{ aspectRatio: "1110 / 1600", backgroundImage: `url(${letterhead})`, containerType: "inline-size" } as React.CSSProperties}
      >
        {/* covers the printed "__/____/20__" blanks */}
        <span
          className="absolute bg-white font-bold text-blue-800"
          style={{ left: "11.7%", top: "18.25%", width: "22.5%", height: "3%", fontSize: "2.4cqw", lineHeight: 1.6, paddingLeft: "1%" }}
        >
          {issuedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>

        <div
          className="absolute inset-x-[5.5%] bottom-[3%] top-[22%] overflow-y-auto rounded-lg bg-white/90 p-[3%]"
          style={{ fontSize: "1.9cqw" }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[1.9em] font-bold tracking-wide">INVOICE</p>
            <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-[0.8em] py-[0.3em] font-semibold text-white">
              <CheckCircle2 className="h-[1.1em] w-[1.1em]" /> PAYMENT SUCCESSFUL
            </span>
          </div>

          <dl className="mt-[1em] grid grid-cols-2 gap-x-[1.5em] gap-y-[0.4em]">
            {[
              ["Invoice no.", invoiceNumber(payment)],
              ["Date & time", issuedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
              ["Order", payment.orderReference ?? "—"],
              ["Payment method", payment.paymentMethodName],
              ["Transaction ref.", payment.transactionReference],
              ["Paid on", payment.paymentDate],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-[0.5em]">
                <dt className="shrink-0 text-gray-500">{k}:</dt>
                <dd className="break-all font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {a && (
            <div className="mt-[1em]">
              <p className="font-bold">Bill to</p>
              <p>{a.fullName}</p>
              <p>{[a.addressLine1, a.addressLine2].filter(Boolean).join(", ")}</p>
              <p>{a.city}, {a.state} - {a.pincode}</p>
              <p>Phone: {a.phone}{a.email ? ` · ${a.email}` : ""}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-[3em]">
              <Loader2 className="h-[2em] w-[2em] animate-spin text-gold-500" />
            </div>
          ) : (
            <table className="mt-[1.2em] w-full border-collapse">
              <thead>
                <tr className="bg-[#111827] text-left text-white">
                  <th className="px-[0.6em] py-[0.5em]">Product</th>
                  <th className="px-[0.6em] py-[0.5em] text-right">Qty</th>
                  <th className="px-[0.6em] py-[0.5em] text-right">Unit price</th>
                  <th className="px-[0.6em] py-[0.5em] text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-[0.6em] py-[0.5em]">{l.name}</td>
                    <td className="px-[0.6em] py-[0.5em] text-right">{l.units}</td>
                    <td className="px-[0.6em] py-[0.5em] text-right">{formatInr(l.unitPrice)}</td>
                    <td className="px-[0.6em] py-[0.5em] text-right">{formatInr(l.units * l.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="px-[0.6em] pt-[0.8em] text-right">Total paid</td>
                  <td className="px-[0.6em] pt-[0.8em] text-right">{formatInr(payment.amount)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          <p className="mt-[2em] text-center text-[0.85em] text-gray-500">
            This is a computer-generated invoice and does not require a signature.
          </p>
        </div>
      </div>
    </Modal>
  );
}
