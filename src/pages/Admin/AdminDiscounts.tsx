import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, Pencil, Percent, Plus, Search, Tag, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import PromoStatusBadge from "../../components/promo/PromoStatusBadge";
import { useToast } from "../../context/ToastContext";
import { sellProductApi } from "../../services/api";
import { PaymentApiError, errorMessage, formatDateTime, formatInr } from "../../services/paymentApi";
import {
  Discount,
  DiscountInput,
  DiscountScope,
  PromoValueType,
  discountAdminApi,
  fromLocalInput,
  promoStatus,
  toLocalInput,
  valueLabel,
} from "../../services/promoApi";
import { mapProduct } from "../productUtils";

// Automatic sale discounts: no code needed, the buyer sees a strike-through price.
// The backend applies the best live discount when it prices products and orders.

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

interface StoreProduct {
  id: number;
  title: string;
  price: number;
}

export default function AdminDiscounts() {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Discount | "new" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Discount | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, prod] = await Promise.all([
        discountAdminApi.list(),
        // Store products (not user listings) — sales only apply to items the store sells
        sellProductApi.getAll(0, 500, "ACTIVE", null, true).catch(() => ({ content: [] })),
      ]);
      setDiscounts(list);
      setProducts(
        prod.content
          .map(mapProduct)
          .filter((p) => p.id != null)
          .map((p) => ({ id: p.id as number, title: p.title, price: Number(p.price) }))
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const productName = useMemo(() => {
    const m = new Map(products.map((p) => [p.id, p.title]));
    return (id: number) => m.get(id) ?? `Product #${id}`;
  }, [products]);

  const toggleActive = async (d: Discount) => {
    setBusyId(d.id);
    try {
      const updated = await discountAdminApi.setActive(d.id, !d.active);
      setDiscounts((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      showToast(updated.active ? `"${d.name}" resumed` : `"${d.name}" paused`, "info");
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
      await discountAdminApi.remove(toDelete.id);
      setDiscounts((list) => list.filter((x) => x.id !== toDelete.id));
      showToast(`"${toDelete.name}" deleted`);
      setToDelete(null);
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const onSaved = (saved: Discount, isNew: boolean) => {
    setDiscounts((list) => (isNew ? [saved, ...list] : list.map((x) => (x.id === saved.id ? saved : x))));
    setEditing(null);
    showToast(isNew ? "Discount created" : "Discount updated");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatic sales on store products — buyers see the reduced price, no code needed. If several apply, the
              biggest one wins.
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gold-600"
          >
            <Plus className="h-4 w-4" /> New discount
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        ) : discounts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
            <Percent className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-800 dark:text-white">No discounts yet</p>
            <p className="mt-1 text-sm text-gray-500">Run a sale on selected products or the whole store.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {discounts.map((d) => {
              const status = promoStatus(d);
              return (
                <div
                  key={d.id}
                  className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
                    status === "ACTIVE" || status === "SCHEDULED" ? "" : "opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">{d.name}</p>
                      <p className="mt-0.5 text-2xl font-bold text-gold-600 dark:text-gold-400">{valueLabel(d.valueType, d.value)}</p>
                    </div>
                    <PromoStatusBadge status={status} />
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Tag className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    {d.scope === "ALL_STORE_PRODUCTS" ? (
                      <span>All store products</span>
                    ) : (
                      <span className="line-clamp-2">
                        {d.productIds.length} product{d.productIds.length === 1 ? "" : "s"}: {d.productIds.map(productName).join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <span>
                      {formatDateTime(d.startsAt)} → {d.endsAt ? formatDateTime(d.endsAt) : "no end date"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 pt-1 sm:mt-auto sm:pt-4">
                    <button
                      onClick={() => setEditing(d)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(d)}
                      disabled={busyId === d.id}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {busyId === d.id ? "Saving…" : d.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => setToDelete(d)}
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
        <DiscountEditor
          discount={editing === "new" ? undefined : editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}

      {toDelete && (
        <Modal isOpen onClose={() => setToDelete(null)} className="max-w-md p-6">
          <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">Delete "{toDelete.name}"?</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Prices go back to normal right away. Orders already placed keep the price they were charged. To stop it
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

function DiscountEditor({
  discount,
  products,
  onClose,
  onSaved,
}: {
  discount?: Discount;
  products: StoreProduct[];
  onClose: () => void;
  onSaved: (d: Discount, isNew: boolean) => void;
}) {
  const [name, setName] = useState(discount?.name ?? "");
  const [valueType, setValueType] = useState<PromoValueType>(discount?.valueType ?? "PERCENTAGE");
  const [value, setValue] = useState(discount ? String(discount.value) : "");
  const [scope, setScope] = useState<DiscountScope>(discount?.scope ?? "SELECTED_PRODUCTS");
  const [selected, setSelected] = useState<Set<number>>(new Set(discount?.productIds ?? []));
  const [startsAt, setStartsAt] = useState(toLocalInput(discount?.startsAt ?? new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(toLocalInput(discount?.endsAt));
  const [active, setActive] = useState(discount?.active ?? true);
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.title?.toLowerCase().includes(q) || String(p.id) === q) : products;
  }, [products, query]);

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const num = Number(value);
  const preview = (price: number) =>
    Math.max(0, valueType === "PERCENTAGE" ? price - (price * num) / 100 : price - num);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give the sale a name, e.g. Diwali Sale.";
    if (!value || Number.isNaN(num) || num <= 0) e.value = "Enter an amount above 0.";
    else if (valueType === "PERCENTAGE" && num >= 100) e.value = "Percentage must be below 100.";
    else if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) e.value = "Use up to 2 decimal places.";
    if (scope === "SELECTED_PRODUCTS" && selected.size === 0) e.productIds = "Pick at least one product.";
    if (!startsAt) e.startsAt = "Choose when the sale starts.";
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) e.endsAt = "End must be after the start.";
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    const body: DiscountInput = {
      name: name.trim(),
      valueType,
      value: num,
      scope,
      productIds: scope === "SELECTED_PRODUCTS" ? [...selected] : [],
      startsAt: fromLocalInput(startsAt)!,
      endsAt: fromLocalInput(endsAt),
      active,
    };
    setSaving(true);
    try {
      const saved = discount ? await discountAdminApi.update(discount.id, body) : await discountAdminApi.create(body);
      onSaved(saved, !discount);
    } catch (err) {
      if (err instanceof PaymentApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const label = (text: string) => (
    <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{text}</span>
  );
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-500">{errors[k]}</p>;
  const segBtn = (on: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
      on ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
    }`;

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-xl p-5 sm:p-7">
      <form onSubmit={submit} noValidate>
        <h2 className="pr-10 text-xl font-bold text-gray-900 dark:text-white">{discount ? "Edit discount" : "New discount"}</h2>

        <div className="mt-5 space-y-4">
          <label className="block">
            {label("Sale name (shown to buyers)")}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Diwali Sale" className={inputCls} />
            {err("name")}
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
              {label(valueType === "PERCENTAGE" ? "Percent off" : "Rupees off each item")}
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                placeholder={valueType === "PERCENTAGE" ? "10" : "500"}
                className={inputCls}
              />
              {err("value")}
            </label>
          </div>

          <div>
            {label("Applies to")}
            <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              <button type="button" onClick={() => setScope("SELECTED_PRODUCTS")} className={segBtn(scope === "SELECTED_PRODUCTS")}>
                Selected products
              </button>
              <button type="button" onClick={() => setScope("ALL_STORE_PRODUCTS")} className={segBtn(scope === "ALL_STORE_PRODUCTS")}>
                Whole store
              </button>
            </div>
          </div>

          {scope === "SELECTED_PRODUCTS" && (
            <div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search store products"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                {filtered.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    {products.length === 0 ? "No store products found." : "No products match your search."}
                  </p>
                ) : (
                  filtered.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{p.title}</span>
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        {selected.has(p.id) && num > 0 ? (
                          <>
                            <span className="mr-1 line-through">{formatInr(p.price)}</span>
                            <span className="font-semibold text-green-600">{formatInr(preview(p.price))}</span>
                          </>
                        ) : (
                          formatInr(p.price)
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">{selected.size} selected</p>
              {err("productIds")}
            </div>
          )}

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
