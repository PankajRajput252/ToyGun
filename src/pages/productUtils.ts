import type { Product } from "./ProductCard";
import PLACEHOLDER_IMAGE from "../components/images/BandookwaleLogo.jpeg";

const API_URL = "https://api.bandookwale.com";

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
  categoryId: item.categoryId,
});

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

// Used when a product page is opened from a shared link (no router state).
export async function fetchProductById(id: number): Promise<Product | null> {
  const res = await fetch(
    `${API_URL}/api/users/getProduct?filterBy=ACTIVE&page=0&size=1&inputPkId=${id}&inputFkId=null&searchValue=null`
  );
  const match = extractList(await res.json()).find((p) => p.productPkId === id);
  return match ? mapProduct(match) : null;
}

export const productUrl = (id?: number) =>
  id != null ? `/bandookwale/productdetails?id=${id}` : "/bandookwale/productdetails";
