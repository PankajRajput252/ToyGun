import { FormEvent, useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Pencil, Plus, QrCode, Upload } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { AuthImage } from "../../components/payment/AuthFilePreview";
import { useToast } from "../../context/ToastContext";
import {
  ACCOUNT_NUMBER_PATTERN,
  BankAccountInput,
  IFSC_PATTERN,
  PaymentApiError,
  PaymentMethod,
  QR_TYPES,
  UPI_ID_PATTERN,
  checkFile,
  errorMessage,
  paymentAdminApi,
} from "../../services/paymentApi";

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

type Editor =
  | { kind: "bank"; method?: PaymentMethod }
  | { kind: "qr"; method?: PaymentMethod }
  | null;

export default function AdminPaymentMethods() {
  const { showToast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMethods(await paymentAdminApi.listMethods());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (m: PaymentMethod) => {
    setTogglingId(m.id);
    try {
      const updated = await paymentAdminApi.setActive(m.id, !m.active);
      setMethods((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      showToast(updated.active ? `"${m.displayName}" is now visible to customers` : `"${m.displayName}" hidden from customers`, "info");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setTogglingId(null);
    }
  };

  const onSaved = (saved: PaymentMethod, isNew: boolean) => {
    setMethods((list) => (isNew ? [...list, saved] : list.map((x) => (x.id === saved.id ? saved : x))));
    setEditor(null);
    showToast(isNew ? "Payment option added" : "Payment option updated");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bank accounts and UPI QR codes customers can pay to. Only active ones are shown at checkout.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditor({ kind: "bank" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" /> Bank account
            </button>
            <button
              onClick={() => setEditor({ kind: "qr" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gold-600"
            >
              <Plus className="h-4 w-4" /> QR code
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        ) : methods.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
            <p className="font-semibold text-gray-800 dark:text-white">No payment methods yet</p>
            <p className="mt-1 text-sm text-gray-500">Add a bank account or a QR code so customers can pay.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {methods.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${m.active ? "" : "opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      {m.type === "QR_CODE" ? <QrCode className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">{m.displayName}</p>
                      <p className="text-xs text-gray-500">{m.type === "QR_CODE" ? "UPI QR code" : "Bank account"}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      m.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {m.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {m.type === "BANK_ACCOUNT" ? (
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-xs text-gray-500">Holder</dt><dd className="text-gray-900 dark:text-gray-100">{m.accountHolderName}</dd></div>
                    <div><dt className="text-xs text-gray-500">Bank</dt><dd className="text-gray-900 dark:text-gray-100">{m.bankName}</dd></div>
                    <div><dt className="text-xs text-gray-500">Account no.</dt><dd className="font-mono text-gray-900 dark:text-gray-100">{m.accountNumber}</dd></div>
                    <div><dt className="text-xs text-gray-500">IFSC</dt><dd className="font-mono text-gray-900 dark:text-gray-100">{m.ifscCode}</dd></div>
                    {m.branchName && <div className="col-span-2"><dt className="text-xs text-gray-500">Branch</dt><dd className="text-gray-900 dark:text-gray-100">{m.branchName}</dd></div>}
                  </dl>
                ) : (
                  <div className="mt-4 flex items-center gap-4">
                    <AuthImage path={paymentAdminApi.qrImagePath(m.id)} alt={`QR for ${m.displayName}`} className="h-28 w-28 rounded-lg bg-white object-contain p-1" />
                    <div className="text-sm">
                      <p className="text-xs text-gray-500">UPI ID</p>
                      <p className="font-mono text-gray-900 dark:text-gray-100">{m.upiId || "—"}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setEditor({ kind: m.type === "QR_CODE" ? "qr" : "bank", method: m })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(m)}
                    disabled={togglingId === m.id}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {togglingId === m.id ? "Saving…" : m.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editor?.kind === "bank" && (
        <BankAccountEditor method={editor.method} onClose={() => setEditor(null)} onSaved={onSaved} />
      )}
      {editor?.kind === "qr" && (
        <QrCodeEditor method={editor.method} onClose={() => setEditor(null)} onSaved={onSaved} />
      )}
    </div>
  );
}

// ─── Bank account form ────────────────────────────────────────────────────────

function BankAccountEditor({
  method,
  onClose,
  onSaved,
}: {
  method?: PaymentMethod;
  onClose: () => void;
  onSaved: (m: PaymentMethod, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<BankAccountInput>({
    displayName: method?.displayName ?? "",
    accountHolderName: method?.accountHolderName ?? "",
    bankName: method?.bankName ?? "",
    accountNumber: method?.accountNumber ?? "",
    ifscCode: method?.ifscCode ?? "",
    branchName: method?.branchName ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof BankAccountInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "ifscCode" ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.displayName.trim()) e.displayName = "Required";
    if (!form.accountHolderName.trim()) e.accountHolderName = "Required";
    if (!form.bankName.trim()) e.bankName = "Required";
    if (!ACCOUNT_NUMBER_PATTERN.test(form.accountNumber.trim())) e.accountNumber = "Must be 9–18 digits";
    if (!IFSC_PATTERN.test(form.ifscCode.trim())) e.ifscCode = "Must be a valid IFSC, e.g. HDFC0001234";
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const body = { ...form, branchName: form.branchName?.trim() || undefined };
      const saved = method
        ? await paymentAdminApi.updateBankAccount(method.id, body)
        : await paymentAdminApi.createBankAccount(body);
      onSaved(saved, !method);
    } catch (err) {
      if (err instanceof PaymentApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof BankAccountInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <input value={form[k] ?? ""} onChange={set(k)} className={inputCls} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-red-500">{errors[k]}</p>}
    </label>
  );

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-lg p-5 sm:p-7">
      <form onSubmit={submit} noValidate>
        <h2 className="pr-10 text-xl font-bold text-gray-900 dark:text-white">{method ? "Edit bank account" : "Add bank account"}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("displayName", "Display name (shown to customers)", { placeholder: "HDFC Current A/c", maxLength: 100 })}</div>
          {field("accountHolderName", "Account holder name", { maxLength: 100 })}
          {field("bankName", "Bank name", { maxLength: 100 })}
          {field("accountNumber", "Account number", { inputMode: "numeric", maxLength: 18 })}
          {field("ifscCode", "IFSC code", { maxLength: 11, placeholder: "HDFC0001234" })}
          <div className="sm:col-span-2">{field("branchName", "Branch (optional)", { maxLength: 100 })}</div>
        </div>
        {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p>}
        <FormButtons saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

// ─── QR code form ─────────────────────────────────────────────────────────────

function QrCodeEditor({
  method,
  onClose,
  onSaved,
}: {
  method?: PaymentMethod;
  onClose: () => void;
  onSaved: (m: PaymentMethod, isNew: boolean) => void;
}) {
  const [displayName, setDisplayName] = useState(method?.displayName ?? "");
  const [upiId, setUpiId] = useState(method?.upiId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "Required";
    if (upiId.trim() && !UPI_ID_PATTERN.test(upiId.trim())) e.upiId = "Enter a valid UPI ID, e.g. store@okhdfcbank";
    if (!method || file) {
      const fe = checkFile(file, QR_TYPES);
      if (fe) e.qrImage = fe;
    }
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const saved = method
        ? await paymentAdminApi.updateQrCode(method.id, { displayName, upiId, qrImage: file })
        : await paymentAdminApi.createQrCode({ displayName, upiId, qrImage: file! });
      onSaved(saved, !method);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-lg p-5 sm:p-7">
      <form onSubmit={submit} noValidate>
        <h2 className="pr-10 text-xl font-bold text-gray-900 dark:text-white">{method ? "Edit QR code" : "Add QR code"}</h2>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Display name (shown to customers)</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Bandookwale UPI" maxLength={100} className={inputCls} />
            {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">UPI ID (optional)</span>
            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="store@okhdfcbank" maxLength={100} className={inputCls} />
            {errors.upiId && <p className="mt-1 text-xs text-red-500">{errors.upiId}</p>}
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              QR code image {method && "(leave empty to keep the current one)"}
            </span>
            <div className="flex items-center gap-4">
              {preview ? (
                <img src={preview} alt="New QR preview" className="h-28 w-28 rounded-lg border bg-white object-contain p-1" />
              ) : method ? (
                <AuthImage path={paymentAdminApi.qrImagePath(method.id)} alt="Current QR" className="h-28 w-28 rounded-lg border bg-white object-contain p-1" />
              ) : null}
              <label className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-300 px-3 py-5 text-center hover:border-gold-500 dark:border-gray-700">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file ? file.name : "Choose image"}</span>
                <span className="text-xs text-gray-500">PNG or JPG · max 5 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {errors.qrImage && <p className="mt-1 text-xs text-red-500">{errors.qrImage}</p>}
          </div>
        </div>
        {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{formError}</p>}
        <FormButtons saving={saving} onClose={onClose} />
      </form>
    </Modal>
  );
}

function FormButtons({ saving, onClose }: { saving: boolean; onClose: () => void }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
