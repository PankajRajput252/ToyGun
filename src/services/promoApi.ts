// Promotions API client: automatic sale discounts and voucher (coupon) codes.
// The backend is the source of truth for every price — the frontend only shows what it returns.
// Contract: docs/DISCOUNTS_AND_VOUCHERS_API.md

import { getJson, sendJson, sendNoContent } from "./paymentApi";

// ─── Types (mirror the backend DTOs) ──────────────────────────────────────────

/** PERCENTAGE: value is 1–100 (% off). FLAT: value is rupees off. */
export type PromoValueType = "PERCENTAGE" | "FLAT";

/** ALL_STORE_PRODUCTS: every admin store product. SELECTED_PRODUCTS: only productIds. */
export type DiscountScope = "ALL_STORE_PRODUCTS" | "SELECTED_PRODUCTS";

export interface DiscountInput {
  name: string;
  valueType: PromoValueType;
  value: number;
  scope: DiscountScope;
  productIds: number[]; // empty when scope is ALL_STORE_PRODUCTS
  startsAt: string; // ISO instant
  endsAt: string | null; // ISO instant; null = no end date
  active: boolean;
}

export interface Discount extends DiscountInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherInput {
  code: string; // upper-case A–Z, 0–9, 4–20 chars
  description: string | null;
  valueType: PromoValueType;
  value: number;
  /** Cap for PERCENTAGE vouchers, in rupees; null = no cap. Ignored for FLAT. */
  maxDiscountAmount: number | null;
  /** Order subtotal needed to use the voucher; null = no minimum. */
  minOrderAmount: number | null;
  /** Total redemptions across all users; null = unlimited. */
  usageLimit: number | null;
  /** Redemptions per user; null = unlimited. */
  perUserLimit: number | null;
  startsAt: string;
  endsAt: string | null;
  active: boolean;
}

export interface Voucher extends VoucherInput {
  id: number;
  /** Orders currently holding this voucher (not cancelled). */
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Result of checking a voucher against the current cart. */
export interface VoucherQuote {
  code: string;
  description: string | null;
  subtotal: number; // cart total after automatic sale discounts
  discountAmount: number; // what the voucher takes off
  total: number; // subtotal − discountAmount
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const discountAdminApi = {
  list: () => getJson<Discount[]>("/api/admin/discounts"),
  create: (body: DiscountInput) => sendJson<Discount>("POST", "/api/admin/discounts", body),
  update: (id: number, body: DiscountInput) => sendJson<Discount>("PUT", `/api/admin/discounts/${id}`, body),
  setActive: (id: number, active: boolean) =>
    sendJson<Discount>("PATCH", `/api/admin/discounts/${id}/status?active=${active}`),
  remove: (id: number) => sendNoContent("DELETE", `/api/admin/discounts/${id}`),
};

export const voucherAdminApi = {
  list: () => getJson<Voucher[]>("/api/admin/vouchers"),
  create: (body: VoucherInput) => sendJson<Voucher>("POST", "/api/admin/vouchers", body),
  update: (id: number, body: VoucherInput) => sendJson<Voucher>("PUT", `/api/admin/vouchers/${id}`, body),
  setActive: (id: number, active: boolean) =>
    sendJson<Voucher>("PATCH", `/api/admin/vouchers/${id}/status?active=${active}`),
  remove: (id: number) => sendNoContent("DELETE", `/api/admin/vouchers/${id}`),
};

// ─── Buyer API ────────────────────────────────────────────────────────────────

export const voucherUserApi = {
  /** Checks a code against the cart. Throws PaymentApiError (400/404) with a readable message when it can't be used. */
  validate: (code: string, items: { productId: number; quantity: number }[]) =>
    sendJson<VoucherQuote>("POST", "/api/vouchers/validate", { code: code.trim().toUpperCase(), items }),
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

export const VOUCHER_CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

export type PromoStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE" | "USED_UP";

/** Status as the buyer would experience it right now. */
export function promoStatus(p: {
  active: boolean;
  startsAt: string;
  endsAt: string | null;
  usageLimit?: number | null;
  usedCount?: number;
}): PromoStatus {
  const now = Date.now();
  if (!p.active) return "INACTIVE";
  if (p.endsAt && new Date(p.endsAt).getTime() <= now) return "EXPIRED";
  if (p.usageLimit != null && (p.usedCount ?? 0) >= p.usageLimit) return "USED_UP";
  if (new Date(p.startsAt).getTime() > now) return "SCHEDULED";
  return "ACTIVE";
}

/** "20% OFF" / "₹500 OFF" */
export const valueLabel = (valueType: PromoValueType, value: number) =>
  valueType === "PERCENTAGE"
    ? `${Number(value)}% OFF`
    : `₹${Number(value).toLocaleString("en-IN")} OFF`;

/** ISO instant → value for <input type="datetime-local"> in the admin's local time. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO instant (null when empty). */
export const fromLocalInput = (v: string): string | null => (v ? new Date(v).toISOString() : null);
