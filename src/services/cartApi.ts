// Server-side cart (backend: CartController, /api/cart — login required).
// Every call returns the whole cart with live prices, so callers just replace their copy.
import { getJson, sendJson } from "./paymentApi";

export interface CartLine {
  productId: number;
  title: string;
  /** Presigned photo URL; null when the product has no photo. */
  image: string | null;
  location: string | null;
  quantity: number;
  /** Price per unit the buyer pays now (after any live sale). */
  unitPrice: number;
  /** List price when a sale lowered it; null otherwise. */
  originalUnitPrice: number | null;
  /** Units in stock; null when the product doesn't track stock. */
  stock: number | null;
  /** false = sold out / not buyable right now (kept in the cart, excluded from totals). */
  available: boolean;
}

export interface CartResponse {
  items: CartLine[];
  totalItems: number;
  subtotal: number;
}

export const cartApi = {
  get: () => getJson<CartResponse>("/api/cart"),
  add: (productId: number, quantity = 1) =>
    sendJson<CartResponse>("POST", "/api/cart/items", { productId, quantity }),
  setQuantity: (productId: number, quantity: number) =>
    sendJson<CartResponse>("PUT", `/api/cart/items/${productId}`, { quantity }),
  remove: (productId: number) => sendJson<CartResponse>("DELETE", `/api/cart/items/${productId}`),
  clear: () => sendJson<CartResponse>("DELETE", "/api/cart"),
};
