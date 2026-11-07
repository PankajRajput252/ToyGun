import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarClock, Copy, Loader2, Pencil, Plus, Shuffle, Ticket, Trash2, Users } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import PromoStatusBadge from "../../components/promo/PromoStatusBadge";
import { useToast } from "../../context/ToastContext";
import { PaymentApiError, errorMessage, formatDateTime, formatInr } from "../../services/paymentApi";
import {
  PromoValueType,
  VOUCHER_CODE_PATTERN,
  Voucher,
  VoucherInput,
  fromLocalInput,
  promoStatus,
  toLocalInput,
  valueLabel,
  voucherAdminApi,
} from "../../services/promoApi";

// Voucher (coupon) codes: the buyer types the code in the cart to get money off the order.

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

/** Random 8-char code without look-alike characters (0/O, 1/I). */
function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function rulesSummary(v: Voucher): string[] {
  const out: string[] = [];
  if (v.minOrderAmount) out.push(`Min. order ${formatInr(v.minOrderAmount)}`);
  if (v.valueType === "PERCENTAGE" && v.maxDiscountAmount) out.push(`Up to ${formatInr(v.maxDiscountAmount)} off`);
  if (v.perUserLimit) out.push(`${v.perUserLimit}× per buyer`);
  return out;
}

export default function AdminVouchers() {
  const { showToast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Voucher | "new" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVouchers(await voucherAdminApi.list());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (v: Voucher) => {
    setBusyId(v.id);
    try {
      const updated = await voucherAdminApi.setActive(v.id, !v.active);
      setVouchers((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      showToast(updated.active ? `${v.code} can be used again` : `${v.code} paused`, "info");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await voucherAdminApi.remove(toDelete.id);
      setVouchers((list) => list.filter((x) => x.id !== toDelete.id));
      showToast(`${toDelete.code} deleted`);
      setToDelete(null);
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Copied ${code}`, "info");
    } catch {
      showToast("Couldn't copy — select the code and copy it manually", "error");
    }
  };

  const onSaved = (saved: Voucher, isNew: boolean) => {
    setVouchers((list) => (isNew ? [saved, ...list] : list.map((x) => (x.id === saved.id ? saved : x))));
    setEditing(null);
    showToast(isNew ? `Voucher ${saved.code} created` : "Voucher updated");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vouchers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Coupon codes buyers enter in the cart. One voucher per order, applied after any sale discounts.
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gold-600"
          >
            <Plus className="h-4 w-4" /> New voucher
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        ) : vouchers.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
            <Ticket className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-800 dark:text-white">No vouchers yet</p>
            <p className="mt-1 text-sm text-gray-500">Create a code like WELCOME10 and share it with buyers.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {vouchers.map((v) => {
              const status = promoStatus(v);
              const rules = rulesSummary(v);
              return (
                <div
                  key={v.id}
                  className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
                    status === "ACTIVE" || status === "SCHEDULED" ? "" : "opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        onClick={() => copy(v.code)}
                        title="Copy code"
                        className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gold-500/60 px-2.5 py-1 font-mono text-base font-bold tracking-wider text-gray-900 hover:bg-gold-500/10 dark:text-white"
                      >
                        {v.code}
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      <p className="mt-2 text-xl font-bold text-gold-600 dark:text-gold-400">{valueLabel(v.valueType, v.value)}</p>
                      {v.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{v.description}</p>}
                    </div>
                    <PromoStatusBadge status={status} />
                  </div>

                  {rules.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rules.map((r) => (
                        <span key={r} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <span>
                      Used {v.usedCount}
                      {v.usageLimit != null ? ` of ${v.usageLimit}` : " times"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <span>
                      {formatDateTime(v.startsAt)} → {v.endsAt ? formatDateTime(v.endsAt) : "no end date"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-auto sm:pt-4">
                    <button
                      onClick={() => setEditing(v)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(v)}
                      disabled={busyId === v.id}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {busyId === v.id ? "Saving…" : v.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => setToDelete(v)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <VoucherEditor voucher={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}

      {toDelete && (
        <Modal isOpen onClose={() => setToDelete(null)} className="max-w-md p-6">
          <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">Delete voucher {toDelete.code}?</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Buyers won't be able to use it any more. Orders that already used it keep their discount. To stop it
            temporarily, use Pause instead.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setToDelete(null)}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={busyId === toDelete.id}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busyId === toDelete.id && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Create / edit form ───────────────────────────────────────────────────────

const optNum = (s: string): number | null => (s.trim() === "" ? null : Number(s));

function VoucherEditor({
  voucher,
  onClose,
  onSaved,
}: {
  voucher?: Voucher;
  onClose: () => void;
  onSaved: (v: Voucher, isNew: boolean) => void;
}) {
  const str = (n: number | null | undefined) => (n == null ? "" : String(n));
  const [code, setCode] = useState(voucher?.code ?? "");
  const [description, setDescription] = useState(voucher?.description ?? "");
  const [valueType, setValueType] = useState<PromoValueType>(voucher?.valueType ?? "PERCENTAGE");
  const [value, setValue] = useState(str(voucher?.value));
  const [maxDiscount, setMaxDiscount] = useState(str(voucher?.maxDiscountAmount));
  const [minOrder, setMinOrder] = useState(str(voucher?.minOrderAmount));
  const [usageLimit, setUsageLimit] = useState(str(voucher?.usageLimit));
  const [perUserLimit, setPerUserLimit] = useState(voucher ? str(voucher.perUserLimit) : "1");
  const [startsAt, setStartsAt] = useState(toLocalInput(voucher?.startsAt ?? new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(toLocalInput(voucher?.endsAt));
  const [active, setActive] = useState(voucher?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const money = /^\d{1,8}(\.\d{1,2})?$/;
  const whole = /^[1-9]\d{0,6}$/;

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    const num = Number(value);
    if (!VOUCHER_CODE_PATTERN.test(code)) e.code = "4–20 letters or digits, no spaces.";
    if (!value || Number.isNaN(num) || num <= 0 || !money.test(value)) e.value = "Enter an amount above 0 (max 2 decimals).";
    else if (valueType === "PERCENTAGE" && num >= 100) e.value = "Percentage must be below 100.";
    if (valueType === "PERCENTAGE" && maxDiscount.trim() && !money.test(maxDiscount.trim())) e.maxDiscountAmount = "Enter a rupee amount.";
    if (minOrder.trim() && !money.test(minOrder.trim())) e.minOrderAmount = "Enter a rupee amount.";
    if (valueType === "FLAT" && !e.value && minOrder.trim() && Number(minOrder) < num)
      e.minOrderAmount = "Should be at least the voucher amount.";
    if (usageLimit.trim() && !whole.test(usageLimit.trim())) e.usageLimit = "Whole number, 1 or more.";
    if (perUserLimit.trim() && !whole.test(perUserLimit.trim())) e.perUserLimit = "Whole number, 1 or more.";
    if (!startsAt) e.startsAt = "Choose when the voucher starts.";
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) e.endsAt = "End must be after the start.";
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    const body: VoucherInput = {
      code,
      description: description.trim() || null,
      valueType,
      value: num,
      maxDiscountAmount: valueType === "PERCENTAGE" ? optNum(maxDiscount) : null,
      minOrderAmount: optNum(minOrder),
      usageLimit: optNum(usageLimit),
      perUserLimit: optNum(perUserLimit),
      startsAt: fromLocalInput(startsAt)!,
      endsAt: fromLocalInput(endsAt),
      active,
    };
    setSaving(true);
    try {
      const saved = voucher ? await voucherAdminApi.update(voucher.id, body) : await voucherAdminApi.create(body);
      onSaved(saved, !voucher);
    } catch (err) {
      if (err instanceof PaymentApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const label = (text: string) => <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{text}</span>;
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-500">{errors[k]}</p>;
  const segBtn = (on: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
      on ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
    }`;

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-xl p-5 sm:p-7">
      <form onSubmit={submit} noValidate>
        <h2 className="pr-10 text-xl font-bold text-gray-900 dark:text-white">{voucher ? `Edit ${voucher.code}` : "New voucher"}</h2>

        <div className="mt-5 space-y-4">
          <div>
            {label("Code")}
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={20}
                placeholder="WELCOME10"
                className={`${inputCls} font-mono tracking-wider`}
              />
              <button
                type="button"
                onClick={() => setCode(randomCode())}
                title="Generate a random code"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Shuffle className="h-4 w-4" /> Generate
              </button>
            </div>
            {err("code")}
          </div>

          <label className="block">
            {label("Description (optional, shown to the buyer)")}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="10% off your first order"
              className={inputCls}
            />
            {err("description")}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {label("Discount type")}
              <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
                <button type="button" onClick={() => setValueType("PERCENTAGE")} className={segBtn(valueType === "PERCENTAGE")}>
                  % off
                </button>
                <button type="button" onClick={() => setValueType("FLAT")} className={segBtn(valueType === "FLAT")}>
                  ₹ off
                </button>
              </div>
            </div>
            <label className="block">
              {label(valueType === "PERCENTAGE" ? "Percent off the order" : "Rupees off the order")}
              <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder={valueType === "PERCENTAGE" ? "10" : "500"} className={inputCls} />
              {err("value")}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {valueType === "PERCENTAGE" && (
              <label className="block">
                {label("Max discount ₹ (optional)")}
                <input value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} inputMode="decimal" placeholder="No cap" className={inputCls} />
                {err("maxDiscountAmount")}
              </label>
            )}
            <label className="block">
              {label("Minimum order ₹ (optional)")}
              <input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} inputMode="decimal" placeholder="No minimum" className={inputCls} />
              {err("minOrderAmount")}
            </label>
            <label className="block">
              {label("Total uses (optional)")}
              <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} inputMode="numeric" placeholder="Unlimited" className={inputCls} />
              {err("usageLimit")}
            </label>
            <label className="block">
              {label("Uses per buyer (optional)")}
              <input value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} inputMode="numeric" placeholder="Unlimited" className={inputCls} />
              {err("perUserLimit")}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              {label("Starts")}
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
              {err("startsAt")}
            </label>
            <label className="block">
              {label("Ends (optional)")}
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
              {err("endsAt")}
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
            />
            Enabled (uncheck to save it paused)
          </label>
        </div>

        {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{formError}</p>}
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
      </form>
    </Modal>
  );
}
