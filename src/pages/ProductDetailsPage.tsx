import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Heart, Share2, ShoppingCart, CheckCircle,
  MessageCircle, Store, Eye, Star
} from "lucide-react";
import { useCart } from "./Cartcontext";
import { useWishlist } from "./Wishlistcontext";
import { viewApi, reviewApi} from "../services/api";


// ── Types ─────────────────────────────────────────────────────────────────
interface Review {
  userReviewPkId?: number;
  userFkId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

// ── Star Rating Component ─────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  readonly = false,
  size = "w-5 h-5",
}: {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: string;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} transition-colors cursor-${readonly ? "default" : "pointer"}
            ${(hovered || value) >= star
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"}`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ProductDetailsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorited, isLoading: isFavLoading, isInitialized } = useWishlist();
  const item = state;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // ── View count state ───────────────────────────────────────────────────
  const [viewCount, setViewCount] = useState<number | null>(null);

  // ── Review state ───────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");

  if (!item) return <div className="p-10 text-center text-gray-500">No product found</div>;

  const images: string[] =
    item.images?.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : ["https://via.placeholder.com/300"];

  const isStoreProduct = item.isStoreProduct === true;
  const cartId = item.id?.toString() || `${item.title}-${item.location}`;
  const alreadyInCart = cartItems.some((c) => c.id === cartId);
  const favorited = item.id != null ? isFavorited(item.id) : false;
  const favLoading = item.id != null ? isFavLoading(item.id) : false;

  // ── On mount: increment view + fetch count + fetch reviews ─────────────
  useEffect(() => {
    if (!item.id) return;

    // Increment view count silently
    viewApi.increment(item.id).catch(console.error);

    // Fetch view count
    viewApi.getCount(item.id)
      .then(setViewCount)
      .catch(console.error);

    // Fetch reviews
    reviewApi.getByProduct(item.id)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [item.id]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const prevImage = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  const handleAddToCart = () => {
    addToCart({
      id: cartId,
      title: item.title,
      price: Number(item.price),
      image: images[0],
      location: item.location,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleChat = () => {
    navigate("/bandookwale/chat", {
      state: {
        productId: item.id?.toString(),
        productTitle: item.title,
        productImage: images[0],
        sellerId: item.sellerId,
        sellerName: item.sellerName || item.sellerId || "Seller",
        buyerId: user?.nodeId,
        buyerName: user?.name || "Me",
      },
    });
  };

  const handleSubmitReview = async () => {
    if (!newRating) return setSubmitError("Please select a star rating.");
    if (!newComment.trim()) return setSubmitError("Please write a comment.");
    if (!user?.nodeId) return setSubmitError("You must be logged in to review.");

    setSubmitting(true);
    setSubmitError("");
    try {
      const posted = await reviewApi.post({
        productFkId: item.id,
        userFkId: user.nodeId,
        rating: newRating,
        comment: newComment.trim(),
      });
      // Optimistically prepend to list
      setReviews((prev) => [
        { ...posted, userName: user.name || "You" },
        ...prev,
      ]);
      setNewRating(0);
      setNewComment("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Average rating ─────────────────────────────────────────────────────
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="max-w-7xl mt-20 mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* LEFT — Images + Details + Reviews */}
      <div className="md:col-span-2 space-y-4">

        {/* Product Type Badge + View Count */}
        <div className="flex items-center justify-between">
          <div>
            {isStoreProduct ? (
              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700
                               text-xs font-semibold px-3 py-1 rounded-full border border-yellow-300">
                <Store className="w-3 h-3" /> Store Product
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700
                               text-xs font-semibold px-3 py-1 rounded-full border border-blue-300">
                <MessageCircle className="w-3 h-3" /> Marketplace Listing
              </span>
            )}
          </div>

          {/* ── VIEW COUNT BADGE ── */}
          {viewCount !== null && (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600
                             text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
              <Eye className="w-3.5 h-3.5" />
              {viewCount.toLocaleString()} {viewCount === 1 ? "view" : "views"}
            </span>
          )}
        </div>

        {/* Image Carousel */}
        <div className="bg-black flex justify-center items-center rounded-lg overflow-hidden relative">
          <img
            src={images[currentIndex]}
            alt={item.title}
            className="max-h-[500px] object-contain w-full"
            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300"; }}
          />
          {images.length > 1 && (
            <>
              <button onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded text-xl">‹</button>
              <button onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded text-xl">›</button>
            </>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-yellow-400" : "bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <img key={i} src={img} alt={`thumb-${i}`}
                onClick={() => setCurrentIndex(i)}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0
                  ${i === currentIndex ? "border-yellow-400" : "border-transparent"}`}
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300"; }}
              />
            ))}
          </div>
        )}

        {/* Details */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Details</h2>
          <div className="flex justify-between border-b pb-3">
            <span className="text-gray-500">Brand</span>
            <span className="font-medium">{item.brand ?? "N/A"}</span>
          </div>
          {item.isNegotiable && (
            <div className="flex justify-between border-b py-3">
              <span className="text-gray-500">Price</span>
              <span className="text-green-600 font-medium">Negotiable</span>
            </div>
          )}
          <h2 className="text-xl font-semibold mt-4">Description</h2>
          <p className="text-gray-700 mt-2">{item.description || "No description provided."}</p>
        </div>

        {/* ── REVIEWS SECTION ───────────────────────────────────────────── */}
        <div className="bg-white p-4 rounded-lg border">

          {/* Header with average */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Reviews ({reviews.length})
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} readonly size="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">
                  {avgRating.toFixed(1)} / 5
                </span>
              </div>
            )}
          </div>

          {/* Write a review */}
          <div className="border rounded-xl p-4 mb-6 bg-gray-50">
            <p className="font-medium text-sm text-gray-700 mb-2">Write a Review</p>

            <StarRating value={newRating} onChange={setNewRating} size="w-6 h-6" />

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={3}
              className="mt-3 w-full border rounded-lg p-3 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            {submitError && (
              <p className="text-red-500 text-xs mt-1">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-green-600 text-xs mt-1">✓ Review submitted!</p>
            )}

            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="mt-3 px-5 py-2 rounded-lg bg-gradient-to-r from-black to-yellow-500
                         text-white text-sm font-semibold hover:opacity-90 transition
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>

          {/* Review list */}
          {reviewsLoading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={r.reviewId ?? i} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center
                                      justify-center text-white text-sm font-bold">
                        {(r.userName || r.userId || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{r.userName || r.userId}</span>
                    </div>
                    <StarRating value={r.rating} readonly size="w-4 h-4" />
                  </div>
                  <p className="text-sm text-gray-600 ml-10">{r.comment}</p>
                  {r.createdAt && (
                    <p className="text-xs text-gray-400 ml-10 mt-1">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Price + Actions (unchanged structure, wishlist now uses context) */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">₹ {Number(item.price).toLocaleString()}</h1>
            <div className="flex gap-3">
              <button title="Share">
                <Share2 className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black transition" />
              </button>

              {/* ── WISHLIST HEART (now uses context, not local state) ── */}
              {!isStoreProduct && item.id != null && (
                <button
                  onClick={() => toggleFavorite(item.id)}
                  disabled={!isInitialized || favLoading}
                  title={favorited ? "Remove from wishlist" : "Add to wishlist"}
                  className="disabled:opacity-50"
                >
                  <Heart className={`w-5 h-5 transition ${
                    favorited ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"
                  }`} />
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-700 mt-2">{item.title}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-3">
            <span>{item.location}</span>
            <span>{item.date}</span>
          </div>

          {/* Store actions */}
          {isStoreProduct && (
            <div className="mt-4 space-y-2">
              <button onClick={handleAddToCart} disabled={alreadyInCart}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
                  ${alreadyInCart ? "bg-green-500 text-white cursor-default"
                    : "bg-gradient-to-r from-black to-yellow-500 text-white hover:opacity-90"}`}>
                {addedToCart ? <><CheckCircle className="w-5 h-5" /> Added!</>
                  : alreadyInCart ? <><CheckCircle className="w-5 h-5" /> In Cart</>
                  : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>}
              </button>
              {alreadyInCart && (
                <button onClick={() => navigate("/bandookwale/cart")}
                  className="w-full py-2 rounded-xl border-2 border-yellow-500 text-yellow-600
                             font-medium hover:bg-yellow-50 transition text-sm">
                  View Cart →
                </button>
              )}
              <button
                onClick={() => { handleAddToCart(); setTimeout(() => navigate("/bandookwale/cart"), 300); }}
                disabled={alreadyInCart}
                className="w-full py-3 rounded-xl border-2 border-black text-black font-semibold
                           hover:bg-black hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                Buy Now
              </button>
            </div>
          )}

          {/* Marketplace actions */}
          {!isStoreProduct && (
            <div className="mt-4 space-y-2">
              <button onClick={handleChat}
                className="w-full py-3 rounded-xl border-2 border-blue-600 text-blue-600
                           font-semibold hover:bg-blue-600 hover:text-white transition
                           flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> Chat with Seller
              </button>
              <button
                onClick={() => item.id != null && toggleFavorite(item.id)}
                disabled={!isInitialized || favLoading}
                className={`w-full py-3 rounded-xl border-2 font-semibold transition
                  flex items-center justify-center gap-2 disabled:opacity-50
                  ${favorited ? "border-red-400 bg-red-50 text-red-500"
                    : "border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"}`}>
                <Heart className={`w-5 h-5 ${favorited ? "fill-red-500" : ""}`} />
                {favLoading ? "..." : favorited ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>
          )}
        </div>

        {/* Seller Card — unchanged */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {(item.sellerName || item.sellerId || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">{isStoreProduct ? "Sold by" : "Posted By"}</p>
              <p className="font-semibold">{item.sellerName || item.sellerId || "Seller"}</p>
              <p className="text-xs text-gray-500">Member since Today</p>
            </div>
          </div>
          {isStoreProduct && (
            <button onClick={() => navigate(`/bandookwale/store/${item.sellerId}`)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg
                         border border-yellow-400 text-yellow-600 text-sm font-medium hover:bg-yellow-50 transition">
              <Store className="w-4 h-4" /> View Store
            </button>
          )}
          {!isStoreProduct && (
            <button onClick={handleChat}
              className="mt-4 w-full border-2 border-blue-600 text-blue-600 py-2 rounded-lg
                         font-medium hover:bg-blue-600 hover:text-white transition">
              Chat with seller
            </button>
          )}
        </div>

        {/* Location */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">{isStoreProduct ? "Ships from" : "Posted in"}</h3>
          <p className="text-gray-600">{item.location}</p>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
            target="_blank" rel="noopener noreferrer">
            <div className="mt-3 h-48 rounded-lg overflow-hidden cursor-pointer">
              <iframe width="100%" height="100%" loading="lazy" style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${encodeURIComponent(item.location)}&output=embed`} />
            </div>
          </a>
        </div>

        <div className="text-xs text-gray-500">AD ID {item.id ?? "N/A"}</div>
      </div>
    </div>
  );
}