
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, MessageCircle, Heart, Loader2,
  Pencil, Trash2, Store, ChevronLeft, ChevronRight, MapPin, Sparkles, Users
} from "lucide-react";
import { useWishlist } from "./Wishlistcontext";
import { addRecentlyViewed, removeRecentlyViewed } from "./recentlyViewed";
import { productUrl, isOutOfStock, stockLeftLabel } from "./productUtils";
import { useToast } from "../context/ToastContext";
import PLACEHOLDER_IMAGE from "../components/images/BandookwaleLogo.jpeg";
import PriceTag from "../components/promo/PriceTag";

export { PLACEHOLDER_IMAGE };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
import { sellProductApi, usersApi } from "../services/api";

export interface Product {
  images: string[];
  price: number;
  title: string;
  location: string;
  date: string;
  createdAt?: string;
  id?: number;
  sellerId?: string;
  sellerName?: string;
  description?: string;
  brand?: string;
  isNegotiable?: boolean;
  isStoreProduct?: boolean;
  /** null/0 = out of stock; undefined = not sent by the API (treated as available) */
  productQuantity?: number | null;
  categoryId?: number;
  subcategoryId?: number;
  weaponCategoryFkId?: number;
  weaponTypeFkId?: number;
  weaponSubTypeFkId?: number;
  caliberFkId?: number;
  isLicenseRequired?: boolean;
  /** Price after the best live sale discount; null/undefined when no sale applies. */
  salePrice?: number | null;
  /** e.g. "20% OFF" — sent by the backend alongside salePrice. */
  discountLabel?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  productImageList?: { productImageId: string; productFkId: null; profileImageUrl: string | null }[];
}

type Props = {
  item: Product;
  onDeleted?: (id: number) => void;
  // Hide owner edit/delete controls (e.g. the "Recently viewed" row is for browsing only)
  readOnly?: boolean;
};

export default function ProductCard({ item, onDeleted, readOnly = false }: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const { toggleFavorite, isFavorited, isLoading, isInitialized } = useWishlist();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { showToast } = useToast();

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const loggedInUserId = user?.nodeId;
  const isOwner = !!loggedInUserId && loggedInUserId === item.sellerId;

  const images = item.images?.length ? item.images : [PLACEHOLDER_IMAGE];
  const isNew = !!item.createdAt && Date.now() - new Date(item.createdAt).getTime() < ONE_DAY_MS;
  const outOfStock = isOutOfStock(item);
  const stockLeft = stockLeftLabel(item);
  // Only Marketplace cards show the seller; store cards skip the lookup
  const sellerName = useSellerName(item.isStoreProduct ? undefined : item.sellerId, item.sellerName);

  const openDetails = () => {
    addRecentlyViewed(item);
    navigate(productUrl(item.id), { state: item });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.id == null) return;
    showToast(isFavorited(item.id) ? "Removed from wishlist" : "Added to wishlist ❤️");
    toggleFavorite(item.id);
  };
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // /admin/* is admin-only — sending a normal seller there bounced them back to Home
    const editPath = item.isStoreProduct ? "/admin/sellProductPage" : "/sellProductPage";
    navigate(editPath, { state: { product: item } });
  };
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.id == null) return;
    try {
      setIsDeleting(true);
      await sellProductApi.delete(item.id);
      setShowDeleteModal(false);
      removeRecentlyViewed(item.id);
      onDeleted?.(item.id);
      showToast("Product deleted");
    } catch (error: any) {
      showToast(`Failed to delete: ${error.message || "Please try again."}`, "error");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeleting) setShowDeleteModal(false);
  };

  const favorited = item.id != null ? isFavorited(item.id) : false;
  const loading = item.id != null ? isLoading(item.id) : false;

  const deleteModal = showDeleteModal && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={handleModalBackdropClick}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm mx-4"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "#2d1515" }}>
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Delete product?</h3>
          <p className="text-sm" style={{ color: "#888" }}>
            <span className="text-[#ccc] font-medium">"{item.title}"</span> will be permanently removed.
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleModalBackdropClick}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{ background: "#252525", color: "#aaa", border: "1px solid #333" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#7f1d1d", color: "#fca5a5" }}
          >
            {isDeleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
            ) : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Pieces shared by the Store and Marketplace cards ──────────────────────
  const topRightControls = (
    <div className="absolute top-2.5 right-2.5 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {isOwner ? (
        !readOnly && <>
          <button
            onClick={handleEdit}
            title="Edit"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm hover:bg-black/80 transition"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={handleDeleteClick}
            title="Delete"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm hover:bg-black/80 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </>
      ) : (
        item.id != null && (
          <button
            onClick={handleWishlistClick}
            disabled={!isInitialized || loading}
            title={favorited ? "Remove from wishlist" : "Add to wishlist"}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm
                       hover:bg-black/80 hover:scale-110 active:scale-95 transition disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Heart
                className={`w-4 h-4 transition-colors ${favorited ? "fill-red-500 text-red-500" : "fill-transparent text-gray-200"}`}
              />
            )}
          </button>
        )
      )}
    </div>
  );

  // Carousel — arrows show on hover (always visible on touch screens)
  const carouselControls = (dotColor: string) =>
    images.length > 1 && (
      <>
        <button
          onClick={prevImage}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center
                     bg-black/50 hover:bg-black/75 transition sm:opacity-0 sm:group-hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center
                     bg-black/50 hover:bg-black/75 transition sm:opacity-0 sm:group-hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? `w-4 ${dotColor}` : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      </>
    );

  const productImage = (dimmed: boolean) => (
    <img
      src={images[index]}
      alt={item.title}
      loading="lazy"
      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${dimmed ? "grayscale opacity-60" : ""}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
      }}
    />
  );

  const newBadge = isNew && (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg bg-red-600 text-white uppercase tracking-wide">
      <Sparkles className="w-3 h-3" />
      New
    </span>
  );

  // ── Marketplace: a classified-ad style card (person-to-person, chat to buy) ──
  if (!item.isStoreProduct) {
    return (
      <>
        {deleteModal}
        <div
          onClick={openDetails}
          className="group cursor-pointer h-full rounded-2xl overflow-hidden flex flex-col
                     bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/70
                     shadow-sm transition-all duration-300
                     hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/15"
        >
          {/* IMAGE — 4:3 suits casual photos better than the store's square shots */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
            {productImage(outOfStock)}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent" />

            {outOfStock && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-md bg-black/75 text-white text-xs sm:text-sm font-bold uppercase tracking-wide shadow-lg">
                  Sold
                </span>
              </div>
            )}

            <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg bg-blue-600 text-white">
                <Users className="w-3 h-3" />
                Marketplace
              </span>
              {newBadge}
            </div>

            {topRightControls}
            {carouselControls("bg-blue-400")}
          </div>

          {/* BODY — title first, then price, then who is selling */}
          <div className="p-3 flex flex-col gap-1.5 flex-1">
            <p className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] text-gray-900 dark:text-white">
              {item.title}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                {item.price > 0 ? `₹ ${item.price.toLocaleString("en-IN")}` : "Ask for price"}
              </span>
              {item.isNegotiable && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                  Negotiable
                </span>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold
                               bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-200">
                {sellerName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 text-[11px] leading-tight">
                <span className="block truncate font-medium text-gray-700 dark:text-gray-200">{isOwner ? "You" : sellerName}</span>
                <span className="block text-gray-500">Individual seller</span>
              </span>
            </div>

            <div className="flex justify-between gap-2 text-[11px] mt-auto pt-1 text-gray-500">
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.location || "India"}</span>
              </span>
              <span className="whitespace-nowrap">{item.date}</span>
            </div>

            {isOwner ? (
              <button
                onClick={readOnly ? (e) => { e.stopPropagation(); openDetails(); } : handleEdit}
                className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                           transition-colors whitespace-nowrap bg-blue-500/10 border border-blue-500/40 text-blue-600 dark:text-blue-300
                           hover:bg-blue-600 hover:text-white"
              >
                {readOnly ? "View item" : <><Pencil className="w-3.5 h-3.5" /> Edit item</>}
              </button>
            ) : outOfStock ? (
              <button
                disabled
                onClick={(e) => e.stopPropagation()}
                className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                           whitespace-nowrap border border-gray-600 text-gray-500 cursor-not-allowed"
              >
                Sold
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); openDetails(); }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                           transition-colors whitespace-nowrap bg-blue-600 text-white hover:bg-blue-500"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chat with seller
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {deleteModal}

      {/* ── Store card ── */}
      <div
        onClick={openDetails}
        className="group cursor-pointer h-full rounded-2xl overflow-hidden flex flex-col
                   bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                   shadow-sm transition-all duration-300
                   hover:-translate-y-1 hover:border-gold-500/70 hover:shadow-xl hover:shadow-gold-500/10"
      >
        {/* IMAGE */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          {productImage(outOfStock)}

          {/* Bottom fade so badges and dots stay readable on bright photos */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-md bg-black/75 text-white text-xs sm:text-sm font-bold uppercase tracking-wide shadow-lg">
                Out of stock
              </span>
            </div>
          )}

          {/* Store / New / Negotiable badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg bg-gold-500 text-white">
              <Store className="w-3 h-3" />
              Store
            </span>
            {newBadge}
            {item.isNegotiable && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-green-900/90 text-green-300">
                Negotiable
              </span>
            )}
          </div>

          {topRightControls}
          {carouselControls("bg-gold-500")}
        </div>

        {/* BODY */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <PriceTag item={item} />
          <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-800 dark:text-gray-200">
            {item.title}
          </p>
          {/* Line is always rendered so cards with and without a stock count stay the same height */}
          <p className="text-[11px] font-medium min-h-[1rem] text-green-600 dark:text-green-400">{stockLeft}</p>

          <div className="flex justify-between gap-2 text-[11px] mt-auto pt-1 text-gray-500">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.location || "India"}</span>
            </span>
            <span className="whitespace-nowrap">{item.date}</span>
          </div>

          {/* CTA — owners edit their own item instead of buying it */}
          {isOwner ? (
            <button
              onClick={readOnly ? (e) => { e.stopPropagation(); openDetails(); } : handleEdit}
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                         transition-colors whitespace-nowrap bg-gold-500/10 border border-gold-500/40 text-gold-400
                         hover:bg-gold-500 hover:text-white"
            >
              {readOnly ? "View item" : <><Pencil className="w-3.5 h-3.5" /> Edit item</>}
            </button>
          ) : outOfStock ? (
            <button
              disabled
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                         whitespace-nowrap border border-gray-600 text-gray-500 cursor-not-allowed"
            >
              Out of stock
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); openDetails(); }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                         transition-colors whitespace-nowrap border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Add to cart & buy
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Seller display names (products only carry the seller's nodeId) ───────────
// Cached per page load so a grid of cards asks once per seller, not once per card.
const sellerNameCache = new Map<string, Promise<string | null>>();

function useSellerName(sellerId?: string, fallback?: string): string {
  const initial = fallback && fallback !== sellerId ? fallback : "";
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (initial || !sellerId) return;
    let cancelled = false;
    if (!sellerNameCache.has(sellerId)) {
      sellerNameCache.set(sellerId, usersApi.getNameByNodeId(sellerId).catch(() => null));
    }
    sellerNameCache.get(sellerId)!.then((n) => { if (!cancelled && n) setName(n); });
    return () => { cancelled = true; };
  }, [sellerId, initial]);
  return name || "Seller";
}
