
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, MessageCircle, Heart, Loader2,
  Pencil, Trash2, Store, ChevronLeft, ChevronRight
} from "lucide-react";
import { useWishlist } from "./Wishlistcontext";
import { sellProductApi } from "../services/api";

export interface Product {
  images: string[];
  price: number;
  title: string;
  location: string;
  date: string;
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

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const loggedInUserId = user?.nodeId;
  const isOwner = !!loggedInUserId && loggedInUserId === item.sellerId;

  const images = item.images?.length ? item.images : ["https://via.placeholder.com/300"];

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
    if (item.id != null) toggleFavorite(item.id);
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
    } catch (error: any) {
      alert(`Failed to delete: ${error.message || "Please try again."}`);
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
        onClick={() => navigate("/bandookwale/productdetails", { state: item })}
        className="group cursor-pointer rounded-xl overflow-hidden flex flex-col"
        style={{
          background: "#1a1a1a",
          border: "0.5px solid #2a2a2a",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c9931a")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
      >
        {/* IMAGE */}
        <div className="relative">
          <img
            src={images[index]}
            alt={item.title}
            className="w-full object-cover"
            style={{ height: "160px" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/300";
            }}
          />

          {/* Store / Listing badge — prominently styled */}
          <div className="absolute top-2.5 left-2.5">
            {item.isStoreProduct ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg"
                style={{ background: "#c9931a", color: "#fff", letterSpacing: "0.01em" }}
              >
                <Store className="w-3 h-3" />
                Store
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-lg"
                style={{ background: "#1d4480", color: "#93c5fd" }}
              >
                <MessageCircle className="w-3 h-3" />
                Listing
              </span>
            )}
          </div>

          {/* Negotiable badge */}
          {item.isNegotiable && (
            <div className="absolute top-10 left-2.5">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: "#14532d", color: "#86efac" }}
              >
                Negotiable
              </span>
            </div>
          )}

          {/* Owner controls / wishlist */}
          <div className="absolute top-2.5 right-2.5 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isOwner ? (
              <>
                <button
                  onClick={handleEdit}
                  title="Edit"
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
                >
                  <Pencil className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                </button>
                <button
                  onClick={handleDeleteClick}
                  title="Delete"
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
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
                  className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-60"
                  style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                  ) : (
                    <Heart
                      className="w-3.5 h-3.5 transition-colors"
                      style={{
                        fill: favorited ? "#ef4444" : "transparent",
                        color: favorited ? "#ef4444" : "#aaa",
                      }}
                    />
                  )}
                </button>
              )
            )}
          </div>

          {/* Carousel */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: i === index ? "16px" : "6px",
                      height: "6px",
                      background: i === index ? "#c9931a" : "rgba(255,255,255,0.4)",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* BODY */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-lg font-semibold" style={{ color: "#fff", lineHeight: 1.2 }}>
            ₹ {Number(item.price).toLocaleString()}
          </p>
          <p className="text-sm truncate" style={{ color: "#aaa" }}>{item.title}</p>

          <div className="flex justify-between text-[11px] mt-1" style={{ color: "#555" }}>
            <span className="truncate max-w-[60%]">{item.location}</span>
            <span>{item.date}</span>
          </div>

          {/* CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate("/bandookwale/productdetails", { state: item }); }}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors"
            style={
              item.isStoreProduct
                ? { background: "transparent", border: "0.5px solid #c9931a", color: "#c9931a" }
                : { background: "transparent", border: "0.5px solid #3b5898", color: "#93c5fd" }
            }
            onMouseEnter={(e) => {
              if (item.isStoreProduct) {
                (e.currentTarget as HTMLButtonElement).style.background = "#c9931a";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              } else {
                (e.currentTarget as HTMLButtonElement).style.background = "#1d3a6e";
              }
            }}
            onMouseLeave={(e) => {
              if (item.isStoreProduct) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#c9931a";
              } else {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
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
