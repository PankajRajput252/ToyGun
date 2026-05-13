import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, MessageCircle, Heart, Loader2, Pencil, Trash2 } from "lucide-react";
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
  // raw fields needed for edit pre-fill
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
  onDeleted?: (id: number) => void; // optional callback to remove card from parent list
};

export default function ProductCard({ item, onDeleted }: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const { toggleFavorite, isFavorited, isLoading, isInitialized } = useWishlist();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ─── Ownership check ──────────────────────────────────────────────────────
  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const loggedInUserId = user?.nodeId;
  const isOwner = !!loggedInUserId && loggedInUserId === item.sellerId;

  const images = item.images?.length
    ? item.images
    : ["https://via.placeholder.com/300"];

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

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/bandookwale/admin/sellProductPage", { state: { product: item } });
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
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
      onDeleted?.(item.id); // tell parent to remove this card
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
      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleModalBackdropClick}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Product?</h3>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-700">"{item.title}"</span> will be
                permanently removed and cannot be recovered.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleModalBackdropClick}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700
                           hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium
                           hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card ── */}
      <div
        onClick={() => navigate("/bandookwale/productdetails", { state: item })}
        className="group cursor-pointer p-[2px] rounded-xl bg-gradient-to-r from-black to-yellow-500"
      >
        <div className="bg-white rounded-xl overflow-hidden relative">

          {/* IMAGE SECTION */}
          <div className="relative">
            <img
              src={images[index]}
              alt={item.title}
              className="w-full h-48 object-cover"
              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300"; }}
            />

            {/* ── STORE / MARKETPLACE BADGE ── */}
            <div className="absolute top-2 left-2">
              {item.isStoreProduct ? (
                <span className="flex items-center gap-1 bg-yellow-500 text-white
                                 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  <ShoppingCart className="w-2.5 h-2.5" /> Store
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-blue-500 text-white
                                 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  <MessageCircle className="w-2.5 h-2.5" /> Listing
                </span>
              )}
            </div>

            {/* ── WISHLIST HEART (non-owner) / EDIT+DELETE (owner) ── */}
            {isOwner ? (
              /* Edit & Delete buttons — top-right, only for owner */
              <div
                className="absolute top-2 right-2 flex gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleEdit}
                  title="Edit product"
                  className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md
                             hover:scale-110 hover:bg-yellow-50 transition-transform"
                >
                  <Pencil className="w-3.5 h-3.5 text-yellow-600" />
                </button>
                <button
                  onClick={handleDeleteClick}
                  title="Delete product"
                  className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-md
                             hover:scale-110 hover:bg-red-50 transition-transform"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ) : (
              /* Wishlist heart — non-owner only */
              item.id != null && (
                <button
                  onClick={handleWishlistClick}
                  disabled={!isInitialized || loading}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5
                             rounded-full shadow-md hover:scale-110 transition-transform
                             disabled:opacity-60"
                  title={favorited ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        favorited ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}
                    />
                  )}
                </button>
              )
            )}

            {/* Negotiable badge */}
            {item.isNegotiable && (
              <div className="absolute top-10 right-2">
                <span className="bg-green-500 text-white text-[10px] font-bold
                                 px-2 py-0.5 rounded-full shadow">
                  Negotiable
                </span>
              </div>
            )}

            {/* Carousel buttons */}
            {images.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 rounded"
              >‹</button>
            )}
            {images.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 rounded"
              >›</button>
            )}

            {/* Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === index ? "bg-yellow-400" : "bg-white"}`} />
                ))}
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="p-3">
            <h3 className="font-bold text-lg">₹ {Number(item.price).toLocaleString()}</h3>
            <p className="text-gray-700 text-sm truncate">{item.title}</p>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{item.location}</span>
              <span>{item.date}</span>
            </div>

            <div className={`mt-2 text-[10px] font-medium flex items-center gap-1
              ${item.isStoreProduct ? "text-yellow-600" : "text-blue-500"}`}>
              {item.isStoreProduct ? (
                <><ShoppingCart className="w-3 h-3" /> Add to cart & buy</>
              ) : (
                <><MessageCircle className="w-3 h-3" /> Chat with seller</>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}