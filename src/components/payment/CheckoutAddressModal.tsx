import { FormEvent, useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Modal } from "../ui/modal";
import {
  PHONE_PATTERN,
  PINCODE_PATTERN,
  PaymentApiError,
  ShippingAddressInput,
  ShopOrder,
  errorMessage,
  formatInr,
  shopOrderApi,
} from "../../services/paymentApi";

const LAST_ADDRESS_KEY = "bw_last_shipping_address";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Cart lines; only numeric product ids can be ordered. */
  items: { productId: number; quantity: number }[];
  /** Cart total shown for reference; the server's total is what gets charged. */
  cartTotal: number;
  onCreated: (order: ShopOrder) => void;
}

type Errors = Partial<Record<keyof ShippingAddressInput, string>>;

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

function initialAddress(): ShippingAddressInput {
  try {
    const saved = localStorage.getItem(LAST_ADDRESS_KEY);
    if (saved) return { ...emptyAddress(), ...JSON.parse(saved) };
  } catch {
    /* ignore */
  }
  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  return { ...emptyAddress(), fullName: user?.name ?? "", email: user?.email ?? "", phone: user?.mobile ?? "" };
}

function emptyAddress(): ShippingAddressInput {
  return { fullName: "", phone: "", email: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" };
}

/** Step 1 of bank/UPI checkout: collect the delivery address and create the order on the server. */
export default function CheckoutAddressModal({ isOpen, onClose, items, cartTotal, onCreated }: Props) {
  const [address, setAddress] = useState<ShippingAddressInput>(initialAddress);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormError(null);
    }
  }, [isOpen]);

  const set = (k: keyof ShippingAddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!address.fullName.trim()) e.fullName = "Enter the recipient's name.";
    if (!PHONE_PATTERN.test(address.phone.trim())) e.phone = "Enter a valid 10-digit mobile number.";
    if (address.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) e.email = "Enter a valid email.";
    if (address.addressLine1.trim().length < 5) e.addressLine1 = "Enter house / flat number and street.";
    if (!address.city.trim()) e.city = "Enter the city.";
    if (!address.state) e.state = "Choose the state.";
    if (!PINCODE_PATTERN.test(address.pincode.trim())) e.pincode = "Enter a valid 6-digit PIN code.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const order = await shopOrderApi.create(items, address);
      localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify(address));
      onCreated(order);
    } catch (err) {
      if (err instanceof PaymentApiError) {
        // Server keys look like "shipping.pincode" → map back to the form field
        const mapped: Errors = {};
        Object.entries(err.fieldErrors).forEach(([k, v]) => {
          const field = k.replace(/^shipping\./, "") as keyof ShippingAddressInput;
          mapped[field] = v;
        });
        setErrors(mapped);
      }
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof ShippingAddressInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, wide = false) => (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <input value={address[k] ?? ""} onChange={set(k)} className={inputCls} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-red-500">{errors[k]}</p>}
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} className="max-w-xl p-5 sm:p-7" showCloseButton={!saving}>
      <form onSubmit={submit} noValidate>
        <div className="flex items-center gap-2 pr-10">
          <MapPin className="h-5 w-5 text-gold-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delivery address</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We'll ship your order here once your payment is verified. Total {formatInr(cartTotal)}.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field("fullName", "Full name", { maxLength: 100, autoComplete: "name" }, true)}
          {field("phone", "Mobile number", { inputMode: "tel", maxLength: 14, autoComplete: "tel", placeholder: "98765 43210" })}
          {field("email", "Email (optional)", { type: "email", maxLength: 150, autoComplete: "email" })}
          {field("addressLine1", "House / flat, street", { maxLength: 200, autoComplete: "address-line1" }, true)}
          {field("addressLine2", "Area, landmark (optional)", { maxLength: 200, autoComplete: "address-line2" }, true)}
          {field("city", "City", { maxLength: 80, autoComplete: "address-level2" })}
          {field("pincode", "PIN code", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">State</span>
            <select value={address.state} onChange={set("state")} className={inputCls} autoComplete="address-level1">
              <option value="">Choose state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
          </label>
        </div>

        {formError && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{formError}</p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-black to-yellow-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Continue to payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
