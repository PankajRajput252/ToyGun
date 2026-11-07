import type { Product } from "./ProductCard";
import PLACEHOLDER_IMAGE from "../components/images/BandookwaleLogo.jpeg";

import { API_BASE_URL as API_URL } from "../services/apiBase";

// "5m ago", "3h ago", "2d ago" — easier to scan than a full date
export const timeAgo = (iso?: string): string => {
  if (!iso) return "Today";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return "Today";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ─── Map raw getProduct API item → Product ─────────────────────────────────────
export const mapProduct = (item: any): Product => ({
  id: item.productPkId,
  images:
    item.productImageList?.length > 0
      ? item.productImageList
          .map((img: any) => img.profileImageUrl)
          .filter(Boolean)
      : [PLACEHOLDER_IMAGE],
  price: item.price,
  title: item.title,
  location:
    item.location ||
    `${item.city || ""}, ${item.state || ""}`.replace(/^,\s*/, ""),
  date: timeAgo(item.createdDatetime),
  createdAt: item.createdDatetime,
  sellerId: item.sellerId,
  sellerName: item.sellerName || item.sellerId || "Seller",
  description: item.description,
  brand: item.brand || "",
  isNegotiable: item.negotiable,
  isStoreProduct: item.isStoreProduct,
  productQuantity: item.productQuantity,
  categoryId: item.categoryId,
  subcategoryId: item.subcategoryId,
  weaponCategoryFkId: item.weaponCategoryFkId,
  weaponTypeFkId: item.weaponTypeFkId,
  weaponSubTypeFkId: item.weaponSubTypeFkId,
  caliberFkId: item.caliberFkId,
  isLicenseRequired: item.isLicenseRequired,
  salePrice: item.salePrice ?? null,
  discountLabel: item.discountLabel ?? null,
});

// ─── Sale discounts (set by admin; the backend sends salePrice when one is live) ──
export const hasSale = (p: Pick<Product, "price" | "salePrice">): boolean =>
  p.salePrice != null && Number(p.salePrice) < Number(p.price);

/** The price the buyer pays for one unit right now. */
export const effectivePrice = (p: Pick<Product, "price" | "salePrice">): number =>
  hasSale(p) ? Number(p.salePrice) : Number(p.price);

// A product can't be bought or chatted about when its quantity is null or 0.
// undefined means the API didn't send the field at all, so it isn't blocked.
export const isOutOfStock = (p: Product): boolean =>
  p.productQuantity === null || (p.productQuantity !== undefined && p.productQuantity <= 0);

// "5 left" label for in-stock products; null when the quantity is unknown or out of stock.
export const stockLeftLabel = (p: Product): string | null =>
  typeof p.productQuantity === "number" && p.productQuantity > 0
    ? `${p.productQuantity.toLocaleString("en-IN")} ${p.productQuantity === 1 ? "item" : "items"} left`
    : null;

// The getProduct endpoint wraps lists differently depending on filters.
const extractList = (data: any): any[] =>
  Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];

export async function fetchProductsByCategory(
  categoryId: number,
  size = 200,
  isStoreProduct: boolean | null = false
): Promise<Product[]> {
  const res = await fetch(
    `${API_URL}/api/users/getProduct?filterBy=ACTIVE&page=0&size=${size}&inputPkId=null&inputFkId=null&searchValue=null&categoryId=${categoryId}&isStoreProduct=${isStoreProduct}`
  );
  return extractList(await res.json()).map(mapProduct);
}

// getProduct has no weapon-category filter (it ignores weaponCategoryFkId), so fetch
// the page and keep the products whose weaponCategoryFkId matches.
export async function fetchProductsByWeaponCategory(
  weaponCategoryId: number,
  size = 200,
  isStoreProduct: boolean | null = false
): Promise<Product[]> {
  const res = await fetch(
    `${API_URL}/api/users/getProduct?filterBy=ACTIVE&page=0&size=${size}&inputPkId=null&inputFkId=null&searchValue=null&isStoreProduct=${isStoreProduct}`
  );
  return extractList(await res.json())
    .filter((item) => item.weaponCategoryFkId === weaponCategoryId)
    .map(mapProduct);
}

// Raw getProduct item — has the weapon fields and image ids that Product drops (used by edit).
export async function fetchRawProductById(id: number): Promise<any | null> {
  const res = await fetch(
    `${API_URL}/api/users/getProduct?filterBy=ACTIVE&page=0&size=1&inputPkId=${id}&inputFkId=null&searchValue=null`
  );
  return extractList(await res.json()).find((p) => p.productPkId === id) ?? null;
}

// Used when a product page is opened from a shared link (no router state).
export async function fetchProductById(id: number): Promise<Product | null> {
  const match = await fetchRawProductById(id);
  return match ? mapProduct(match) : null;
}

// Like fetchProductById, but throws when the request itself fails, so callers can tell
// "backend says this product doesn't exist" (null) apart from "couldn't reach the backend" (throws).
// Pass the product's own isStoreProduct: without it the backend answers 500 instead of an empty list.
export async function lookupProductById(id: number, isStoreProduct: boolean): Promise<Product | null> {
  const res = await fetch(
    `${API_URL}/api/users/getProduct?filterBy=ACTIVE&page=0&size=1&inputPkId=${id}&inputFkId=null&searchValue=null&isStoreProduct=${isStoreProduct}`
  );
  if (!res.ok) throw new Error(`getProduct ${id} failed: HTTP ${res.status}`);
  const match = extractList(await res.json()).find((p) => p.productPkId === id);
  return match ? mapProduct(match) : null;
}

export const productUrl = (id?: number) =>
  id != null ? `/productdetails?id=${id}` : "/productdetails";
