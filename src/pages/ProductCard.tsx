
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, MessageCircle, Heart, Loader2,
  Pencil, Trash2, Store, ChevronLeft, ChevronRight, MapPin, Sparkles
} from "lucide-react";
import { useWishlist } from "./Wishlistcontext";
import { addRecentlyViewed } from "./recentlyViewed";
import { productUrl } from "./productUtils";
import { useToast } from "../context/ToastContext";
import PLACEHOLDER_IMAGE from "../components/images/BandookwaleLogo.jpeg";

export { PLACEHOLDER_IMAGE };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
import { sellProductApi } from "../services/api";

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
  categoryId?: number;
  subcategoryId?: number;
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
};

export default function ProductCard({ item, onDeleted }: Props) {
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
    navigate("/bandookwale/admin/sellProductPage", { state: { product: item } });
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

  return (
    <>
      {/* ── Delete Modal ── */}
      {showDeleteModal && (
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
      )}

      {/* ── Card ── */}
      <div
        onClick={openDetails}
        className="group cursor-pointer rounded-2xl overflow-hidden flex flex-col
                   bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                   shadow-sm transition-all duration-300
                   hover:-translate-y-1 hover:border-gold-500/70 hover:shadow-xl hover:shadow-gold-500/10"
      >
        {/* IMAGE */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={images[index]}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />

          {/* Bottom fade so badges and dots stay readable on bright photos */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Store / Listing / New / Negotiable badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
            {item.isStoreProduct ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg bg-gold-500 text-white">
                <Store className="w-3 h-3" />
                Store
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg bg-blue-900/90 text-blue-200">
                <MessageCircle className="w-3 h-3" />
                Listing
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg bg-red-600 text-white uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                New
              </span>
            )}
            {item.isNegotiable && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-green-900/90 text-green-300">
                Negotiable
              </span>
            )}
          </div>

          {/* Owner controls / wishlist */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isOwner ? (
              <>
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

          {/* Carousel — arrows show on hover (always visible on touch screens) */}
          {images.length > 1 && (
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
                    className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? "w-4 bg-gold-500" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* BODY */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-lg sm:text-xl font-bold break-words leading-tight text-gold-600 dark:text-gold-400">
            ₹ {Number(item.price).toLocaleString("en-IN")}
          </p>
          <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-800 dark:text-gray-200">
            {item.title}
          </p>

          <div className="flex justify-between gap-2 text-[11px] mt-auto pt-1 text-gray-500">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.location || "India"}</span>
            </span>
            <span className="whitespace-nowrap">{item.date}</span>
          </div>

          {/* CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); openDetails(); }}
            className={`mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold
                        transition-colors whitespace-nowrap border
                        ${item.isStoreProduct
                          ? "border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white"
                          : "border-blue-700 text-blue-300 hover:bg-blue-900/60"}`}
          >
            {item.isStoreProduct ? (
              <><ShoppingCart className="w-3.5 h-3.5" /> Add to cart & buy</>
            ) : (
              <><MessageCircle className="w-3.5 h-3.5" /> Chat with seller</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
