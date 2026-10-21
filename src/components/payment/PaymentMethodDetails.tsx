import { Smartphone } from "lucide-react";
import type { PaymentMethod } from "../../services/paymentApi";
import CopyField from "./CopyField";
import { AuthImage } from "./AuthFilePreview";

/** What the user needs to actually make the payment: bank details or the QR code. */
export default function PaymentMethodDetails({ method, amount }: { method: PaymentMethod; amount?: number }) {
  if (method.type === "BANK_ACCOUNT") {
    return (
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/60">
        <CopyField label="Account holder" value={method.accountHolderName} />
        <CopyField label="Bank" value={method.bankName} />
        <CopyField label="Account number" value={method.accountNumber} mono />
        <CopyField label="IFSC code" value={method.ifscCode} mono />
        <CopyField label="Branch" value={method.branchName} />
      </div>
    );
  }

  const upiLink =
    method.upiId &&
    `upi://pay?pa=${encodeURIComponent(method.upiId)}&pn=${encodeURIComponent(method.displayName)}` +
      (amount ? `&am=${amount.toFixed(2)}` : "") +
      "&cu=INR";

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
      {method.qrImageUrl && (
        <AuthImage
          path={method.qrImageUrl}
          alt={`QR code for ${method.displayName}`}
          className="h-56 w-56 rounded-lg bg-white object-contain p-2"
        />
      )}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)</p>
      {method.upiId && (
        <div className="w-full">
          <CopyField label="UPI ID" value={method.upiId} mono />
        </div>
      )}
      {upiLink && (
        <a
          href={upiLink}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 sm:hidden"
        >
          <Smartphone className="h-4 w-4" /> Pay with UPI app
        </a>
      )}
    </div>
  );
}
