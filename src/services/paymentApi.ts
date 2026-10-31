// Manual payment (bank transfer / UPI QR + receipt upload) API client.
// Talks to the Spring Boot payment module. Uses the same JWT the rest of the app stores.

import { getAuthToken } from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.bandookwale.com";

// ─── Types (mirror the backend DTOs) ──────────────────────────────────────────

export type PaymentMethodType = "BANK_ACCOUNT" | "QR_CODE";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaymentMethod {
  id: number;
  type: PaymentMethodType;
  displayName: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  qrImageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSubmission {
  id: number;
  userId: string;
  paymentMethodId: number;
  paymentMethodType: PaymentMethodType;
  paymentMethodName: string;
  amount: number;
  transactionReference: string;
  paymentDate: string; // YYYY-MM-DD
  remarks: string | null;
  orderReference: string | null;
  receiptUrl: string;
  receiptFileName: string;
  status: PaymentStatus;
  rejectionReason: string | null;
  reviewedBy: string | null; // admin responses only
  reviewedAt: string | null;
  submittedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BankAccountInput {
  displayName: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
}

export interface SubmitPaymentInput {
  paymentMethodId: number;
  amount: string; // "1500.00"
  transactionReference: string;
  paymentDate: string; // YYYY-MM-DD
  remarks?: string;
  orderReference?: string;
  productIds?: number[];
  receipt: File;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/** Shape of the backend's problem+json error body. */
export interface ApiProblem {
  status: number;
  title?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string>; // field name → message (validation failures)
}

export class PaymentApiError extends Error {
  constructor(public problem: ApiProblem) {
    super(
      problem.detail ||
        problem.message ||
        (problem.status === 401
          ? "Your session has expired. Please sign in again."
          : problem.status === 403
          ? "You don't have permission to do this."
          : problem.title || `Request failed (${problem.status})`)
    );
  }
  get status() {
    return this.problem.status;
  }
  get fieldErrors(): Record<string, string> {
    return this.problem.errors ?? {};
  }
}

/** Turns anything thrown by this client into a message you can show. */
export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

// ─── Low-level helpers ────────────────────────────────────────────────────────

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", headers.get("Accept") ?? "application/json");

  let res: Response;
  try {
    res = await fetch(API_BASE_URL + path, { ...init, headers });
  } catch {
    throw new PaymentApiError({ status: 0, detail: "Cannot reach the server. Check your connection." });
  }

  if (!res.ok) {
    let problem: ApiProblem = { status: res.status, title: res.statusText };
    try {
      problem = { ...problem, ...(await res.json()), status: res.status };
    } catch {
      /* 401/403 may come without a JSON body */
    }
    throw new PaymentApiError(problem);
  }
  return res;
}

const getJson = async <T>(path: string, init?: RequestInit): Promise<T> =>
  (await request(path, init)).json() as Promise<T>;

const sendJson = <T>(method: string, path: string, body?: unknown) =>
  getJson<T>(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/**
 * QR images and receipts need the Authorization header, so <img src="/api/..."> won't work.
 * This fetches the file and returns a blob: URL (remember to URL.revokeObjectURL it).
 */
export async function fetchFileBlob(path: string): Promise<Blob> {
  return (await request(path, { headers: { Accept: "*/*" } })).blob();
}

// ─── End-user API ─────────────────────────────────────────────────────────────

export const paymentUserApi = {
  listMethods: () => getJson<PaymentMethod[]>("/api/payment-methods"),

  submitPayment: (input: SubmitPaymentInput) => {
    const form = new FormData();
    form.append("paymentMethodId", String(input.paymentMethodId));
    form.append("amount", input.amount);
    form.append("transactionReference", input.transactionReference.trim());
    form.append("paymentDate", input.paymentDate);
    if (input.remarks?.trim()) form.append("remarks", input.remarks.trim());
    if (input.orderReference) form.append("orderReference", input.orderReference);
    // Repeated field → binds to List<Long> productIds on the backend
    input.productIds?.forEach((id) => form.append("productIds", String(id)));
    form.append("receipt", input.receipt);
    // No Content-Type header: the browser sets multipart boundary itself.
    return getJson<PaymentSubmission>("/api/payments", { method: "POST", body: form });
  },

  myPayments: () => getJson<PaymentSubmission[]>("/api/payments"),
  getPayment: (id: number) => getJson<PaymentSubmission>(`/api/payments/${id}`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const paymentAdminApi = {
  // Payment method setup
  listMethods: () => getJson<PaymentMethod[]>("/api/admin/payment-methods"),

  createBankAccount: (body: BankAccountInput) =>
    sendJson<PaymentMethod>("POST", "/api/admin/payment-methods/bank-account", body),

  updateBankAccount: (id: number, body: BankAccountInput) =>
    sendJson<PaymentMethod>("PUT", `/api/admin/payment-methods/bank-account/${id}`, body),

  createQrCode: (input: { displayName: string; upiId?: string; qrImage: File }) => {
    const form = new FormData();
    form.append("displayName", input.displayName.trim());
    if (input.upiId?.trim()) form.append("upiId", input.upiId.trim());
    form.append("qrImage", input.qrImage);
    return getJson<PaymentMethod>("/api/admin/payment-methods/qr-code", { method: "POST", body: form });
  },

  updateQrCode: (id: number, input: { displayName?: string; upiId?: string; qrImage?: File | null }) => {
    const form = new FormData();
    if (input.displayName?.trim()) form.append("displayName", input.displayName.trim());
    if (input.upiId !== undefined) form.append("upiId", input.upiId.trim()); // "" clears it
    if (input.qrImage) form.append("qrImage", input.qrImage);
    return getJson<PaymentMethod>(`/api/admin/payment-methods/qr-code/${id}`, { method: "PUT", body: form });
  },

  setActive: (id: number, active: boolean) =>
    sendJson<PaymentMethod>("PATCH", `/api/admin/payment-methods/${id}/status?active=${active}`),

  /** Admin can view QR images of inactive methods too. */
  qrImagePath: (id: number) => `/api/admin/payment-methods/${id}/qr-image`,

  // Payment review
  listPayments: (q: { status?: PaymentStatus; page?: number; size?: number; sort?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    return getJson<PageResponse<PaymentSubmission>>(`/api/admin/payments?${params}`);
  },

  getPayment: (id: number) => getJson<PaymentSubmission>(`/api/admin/payments/${id}`),

  approve: (id: number, productIds: number[] = []) =>
    sendJson<PaymentSubmission>("PUT", `/api/admin/payments/${id}/approve`, { productIds }),

  reject: (id: number, reason: string, productIds: number[] = []) =>
    sendJson<PaymentSubmission>("PUT", `/api/admin/payments/${id}/reject`, { reason: reason.trim(), productIds }),
};

// ─── Shop orders (checkout address + items, Shiprocket status) ───────────────

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED";
export type ShippingStatus =
  | "NOT_STARTED"
  | "MANUAL_REVIEW"
  | "PROCESSING"
  | "ORDER_CREATED"
  | "AWB_ASSIGNED"
  | "PICKUP_SCHEDULED"
  | "FAILED";

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ShopOrder {
  orderReference: string;
  userId: string | null; // admin view only
  status: OrderStatus;
  subtotal: number;
  items: {
    productId: number;
    productName: string;
    units: number;
    unitPrice: number;
    licenceRequired: boolean;
    storeProduct: boolean;
  }[];
  shippingAddress: ShippingAddressInput & { country: string };
  paidPaymentSubmissionId: number | null;
  paidAt: string | null;
  shipping: {
    status: ShippingStatus;
    awbCode: string | null;
    courierName: string | null;
    pickupScheduledDate: string | null;
    trackingUrl: string | null;
    // admin view only
    shiprocketOrderId: number | null;
    shiprocketShipmentId: number | null;
    error: string | null;
    attempts: number | null;
    lastAttemptAt: string | null;
  };
  createdAt: string;
}

export const shopOrderApi = {
  /** Creates the order on the server; prices come from the products table. */
  create: (items: { productId: number; quantity: number }[], shipping: ShippingAddressInput) =>
    sendJson<ShopOrder>("POST", "/api/shop-orders", { items, shipping }),
  myOrders: () => getJson<ShopOrder[]>("/api/shop-orders"),
  get: (orderReference: string) => getJson<ShopOrder>(`/api/shop-orders/${encodeURIComponent(orderReference)}`),
};

export const adminShopOrderApi = {
  list: (q: { status?: OrderStatus; shippingStatus?: ShippingStatus; page?: number; size?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    return getJson<PageResponse<ShopOrder>>(`/api/admin/shop-orders?${params}`);
  },
  get: (orderReference: string) =>
    getJson<ShopOrder>(`/api/admin/shop-orders/${encodeURIComponent(orderReference)}`),
  /** Runs the remaining Shiprocket steps now. */
  ship: (orderReference: string) =>
    sendJson<ShopOrder>("POST", `/api/admin/shop-orders/${encodeURIComponent(orderReference)}/ship`),
};

export const PHONE_PATTERN = /^(\+?91[\s-]?|0)?[6-9]\d{9}$/;
export const PINCODE_PATTERN = /^[1-9]\d{5}$/;

// ─── Shared client-side rules (mirror the server's validation) ────────────────

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const RECEIPT_TYPES = ["image/png", "image/jpeg", "application/pdf"];
export const QR_TYPES = ["image/png", "image/jpeg"];
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;
export const UPI_ID_PATTERN = /^[\w.-]{2,256}@[A-Za-z]{2,64}$/;
export const TXN_REF_PATTERN = /^[A-Za-z0-9-]+$/;

/** Returns an error message, or null if the file is acceptable. */
export function checkFile(file: File | null | undefined, allowed: string[]): string | null {
  if (!file) return "Please choose a file.";
  if (file.size > MAX_UPLOAD_BYTES) return "File is too large. Maximum size is 5 MB.";
  if (file.type && !allowed.includes(file.type)) {
    return allowed.includes("application/pdf")
      ? "Only PNG, JPG or PDF files are allowed."
      : "Only PNG or JPG images are allowed.";
  }
  return null;
}

/** Today's date as YYYY-MM-DD in the user's local time zone. */
export const todayIso = () => new Date().toLocaleDateString("en-CA");

export const formatInr = (n: number) =>
  `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
