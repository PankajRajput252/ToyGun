import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart, Share2, ShoppingCart, CheckCircle, MessageCircle, Store, Eye, Star,
  ChevronLeft, ChevronRight, X, Maximize2, MapPin, Clock,
  ShieldCheck, Handshake, Search, Ban, Scale, Loader2, Link2,
} from "lucide-react";
import { useCart } from "./Cartcontext";
import { useWishlist } from "./Wishlistcontext";
import { viewApi, reviewApi, sellProductApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import ProductCard, { type Product, PLACEHOLDER_IMAGE } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { addRecentlyViewed } from "./recentlyViewed";
import { mapProduct, fetchProductsByCategory, fetchProductById, productUrl, isOutOfStock, stockLeftLabel } from "./productUtils";

// ── Types ─────────────────────────────────────────────────────────────────
interface Review {
  userReviewPkId?: number;
  reviewId?: number;
  userFkId: string;
  userId?: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

const RELATED_LIMIT = 12;
const SWIPE_THRESHOLD_PX = 50;

const SAFETY_TIPS = [
  { icon: Handshake, text: "Meet the seller in a safe, public place" },
  { icon: Search, text: "Inspect the item properly before you pay" },
  { icon: Ban, text: "Never pay in advance to someone you haven't met" },
  { icon: Scale, text: "Check your local laws for replicas and airsoft items" },
];

const card = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl";

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
          className={`${size} transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}
            ${(hovered || value) >= star
              ? "fill-gold-400 text-gold-400"
              : "text-gray-300 dark:text-gray-600"}`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );
}

// ── Image gallery: swipe, arrows, thumbnails, full-screen viewer with zoom ──
function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const hasMany = images.length > 1;
  const prev = useCallback(() => {
    setZoomOrigin(null);
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);
  const next = useCallback(() => {
    setZoomOrigin(null);
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard controls + lock page scroll while the viewer is open
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isFullscreen, prev, next]);

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchStartX.current == null || !hasMany) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX) (dx < 0 ? next : prev)();
      touchStartX.current = null;
    },
  };

  const toggleZoom = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoomOrigin) return setZoomOrigin(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center " +
    "bg-black/50 text-white hover:bg-black/75 backdrop-blur-sm transition";

  return (
    <div>
      <div
        className="group relative bg-black rounded-2xl overflow-hidden aspect-[4/3] select-none"
        {...swipeHandlers}
      >
        <img
          src={images[index]}
          alt={title}
          onClick={() => setIsFullscreen(true)}
          className="w-full h-full object-contain cursor-zoom-in"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
        />

        <button
          onClick={() => setIsFullscreen(true)}
          title="View full screen"
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-black/50 text-white hover:bg-black/75 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {hasMany && (
          <>
            <button onClick={prev} className={`${arrowClass} left-3 sm:opacity-0 sm:group-hover:opacity-100`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className={`${arrowClass} right-3 sm:opacity-0 sm:group-hover:opacity-100`}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="absolute bottom-3 right-3 text-xs font-medium text-white bg-black/60 px-2.5 py-1 rounded-full">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {hasMany && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${title} ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl cursor-pointer border-2 flex-shrink-0 transition
                ${i === index ? "border-gold-500" : "border-transparent opacity-60 hover:opacity-100"}`}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
            />
          ))}
        </div>
      )}

      {/* Full-screen viewer */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[90] bg-black/95 flex items-center justify-center" {...swipeHandlers}>
          <button
            onClick={() => setIsFullscreen(false)}
            title="Close"
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-full h-full overflow-hidden flex items-center justify-center p-4">
            <img
              src={images[index]}
              alt={title}
              onClick={toggleZoom}
              style={zoomOrigin ? { transform: "scale(2.2)", transformOrigin: zoomOrigin } : undefined}
              className={`max-w-full max-h-full object-contain transition-transform duration-300
                          ${zoomOrigin ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            />
          </div>
          {hasMany && (
            <>
              <button onClick={prev} className={`${arrowClass} left-4 w-12 h-12`}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={next} className={`${arrowClass} right-4 w-12 h-12`}>
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {index + 1} / {images.length} · tap image to zoom
          </span>
        </div>
      )}
    </div>
  );
}

// ── Horizontal row of product cards ───────────────────────────────────────
function ProductRow({ title, products, loading }: { title: string; products: Product[]; loading: boolean }) {
  if (!loading && products.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-40 sm:w-52 flex-shrink-0"><ProductCardSkeleton /></div>
            ))
          : products.map((p) => (
              <div key={p.id} className="w-40 sm:w-52 flex-shrink-0 snap-start"><ProductCard item={p} /></div>
            ))}
      </div>
    </section>
  );
}

// ── Page: resolves the product from router state or ?id= (shared links) ──
export default function ProductDetailsPage() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const idParam = Number(searchParams.get("id")) || null;

  const [fetched, setFetched] = useState<Product | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const item: Product | null = state ?? fetched;

  useEffect(() => {
    if (state || !idParam) return;
    setIsFetching(true);
    fetchProductById(idParam)
      .then(setFetched)
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, [state, idParam]);

  if (isFetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }
  if (!item) {
    return <div className="p-10 text-center text-gray-500">No product found</div>;
  }
  // key → state resets when moving to another product from the "similar" rows
  return <ProductDetails key={item.id ?? item.title} item={item} />;
}

function ProductDetails({ item }: { item: Product }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorited, isLoading: isFavLoading, isInitialized } = useWishlist();

  const [addedToCart, setAddedToCart] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);

  // ── Review state ───────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  // ── Related products ───────────────────────────────────────────────────
  const [similar, setSimilar] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [fromSeller, setFromSeller] = useState<Product[]>([]);
  const [fromSellerLoading, setFromSellerLoading] = useState(true);

  // ── Make an offer ──────────────────────────────────────────────────────
  const [showOffer, setShowOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");

  const images: string[] = item.images?.length > 0 ? item.images : [PLACEHOLDER_IMAGE];
  const isStoreProduct = item.isStoreProduct === true;
  const isOwner = !!user?.nodeId && user.nodeId === item.sellerId;
  const outOfStock = isOutOfStock(item);
  const stockLeft = stockLeftLabel(item);
  const cartId = item.id?.toString() || `${item.title}-${item.location}`;
  const alreadyInCart = cartItems.some((c) => c.id === cartId);
  const favorited = item.id != null ? isFavorited(item.id) : false;
  const favLoading = item.id != null ? isFavLoading(item.id) : false;
  const sellerName = item.sellerName || item.sellerId || "Seller";

  // ── On mount: record view, load views, reviews, related products ───────
  useEffect(() => {
    window.scrollTo({ top: 0 });
    addRecentlyViewed(item);
    if (!item.id) return;

    viewApi.add({ userFkId: user?.nodeId, productFkId: item.id }).catch(console.error);
    viewApi.get(item.id)
      .then((response) => setViewCount(response.length || 0))
      .catch(console.error);

    reviewApi.getByProduct(item.id)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setReviewsLoading(false));

    const notThis = (p: Product) => p.id !== item.id;

    if (item.categoryId != null) {
      fetchProductsByCategory(item.categoryId, RELATED_LIMIT + 1, isStoreProduct)
        .then((list) => setSimilar(list.filter(notThis).slice(0, RELATED_LIMIT)))
        .catch(console.error)
        .finally(() => setSimilarLoading(false));
    } else {
      setSimilarLoading(false);
    }

    if (item.sellerId) {
      sellProductApi.getAll(0, RELATED_LIMIT + 1, "ACTIVE", item.sellerId, isStoreProduct)
        .then((res) => setFromSeller(res.content.map(mapProduct).filter(notThis).slice(0, RELATED_LIMIT)))
        .catch(console.error)
        .finally(() => setFromSellerLoading(false));
    } else {
      setFromSellerLoading(false);
    }
  }, [item.id]);

  // ── Actions ────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (outOfStock) return showToast("This product is out of stock", "error");
    addToCart({
      id: cartId,
      title: item.title,
      price: Number(item.price),
      image: images[0],
      location: item.location,
    });
    setAddedToCart(true);
    showToast("Added to cart 🛒");
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleChat = (initialMessage?: string) => {
    // The owner can still open their own chats; buyers can't start one on an out-of-stock item
    if (outOfStock && !isOwner) return showToast("This product is out of stock", "error");
    navigate("/chat", {
      state: {
        productId: item.id?.toString(),
        productTitle: item.title,
        productImage: images[0],
        sellerId: item.sellerId,
        sellerName: item.sellerName, // chat falls back to "Seller" rather than showing the node id
        buyerId: user?.nodeId,
        buyerName: user?.name || "Me",
        initialMessage,
      },
    });
  };

  const handleSendOffer = () => {
    const amount = Number(offerPrice);
    if (!amount || amount <= 0) return showToast("Enter a valid offer amount", "error");
    handleChat(`Hi! I'm interested in "${item.title}". Would you accept ₹${amount.toLocaleString("en-IN")}?`);
  };

  const handleToggleWishlist = () => {
    if (item.id == null) return;
    showToast(favorited ? "Removed from wishlist" : "Added to wishlist ❤️");
    toggleFavorite(item.id);
  };

  const shareUrl = `${window.location.origin}${productUrl(item.id)}`;
  const shareText = `${item.title} — ₹${Number(item.price).toLocaleString("en-IN")} on Bandookwale`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: shareText, url: shareUrl });
      } catch {
        // User closed the share sheet — nothing to do
      }
      return;
    }
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied 🔗");
    } catch {
      showToast("Couldn't copy the link", "error");
    }
  };

  const handleSubmitReview = async () => {
    if (!newRating) return setSubmitError("Please select a star rating.");
    if (!newComment.trim()) return setSubmitError("Please write a comment.");
    if (!user?.nodeId) return setSubmitError("You must be logged in to review.");
    if (item.id == null) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const posted = await reviewApi.post({
        productFkId: item.id,
        userFkId: user.nodeId,
        rating: newRating,
        comment: newComment.trim(),
      });
      setReviews((prev) => [{ ...posted, userName: user.name || "You" }, ...prev]);
      setNewRating(0);
      setNewComment("");
      showToast("Review submitted — thank you!");
    } catch {
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden text-gray-900 dark:text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gold-500 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* LEFT — Gallery + Details + Reviews */}
        <div className="md:col-span-2 space-y-4 min-w-0">
          <Gallery images={images} title={item.title} />

          {/* Details */}
          <div className={`${card} p-5`}>
            <h2 className="text-lg font-semibold mb-3">Details</h2>
            <dl className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500">Brand</dt>
                <dd className="font-medium">{item.brand || "N/A"}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium">{isStoreProduct ? "Store product" : "Marketplace listing"}</dd>
              </div>
              {item.isNegotiable && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-gray-500">Price</dt>
                  <dd className="text-green-500 font-medium">Negotiable</dd>
                </div>
              )}
              <div className="flex justify-between py-2.5">
                <dt className="text-gray-500">Ad ID</dt>
                <dd className="font-medium">{item.id ?? "N/A"}</dd>
              </div>
            </dl>
            <h2 className="text-lg font-semibold mt-5">Description</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 break-words whitespace-pre-line leading-relaxed">
              {item.description || "No description provided."}
            </p>
          </div>

          {/* Reviews */}
          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(avgRating)} readonly size="w-4 h-4" />
                  <span className="text-sm font-medium">{avgRating.toFixed(1)} / 5</span>
                </div>
              )}
            </div>

            <div className="rounded-xl p-4 mb-6 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <p className="font-medium text-sm mb-2">Write a review</p>
              <StarRating value={newRating} onChange={setNewRating} size="w-6 h-6" />
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={3}
                className="mt-3 w-full rounded-lg p-3 text-sm resize-none bg-white dark:bg-gray-900
                           border border-gray-300 dark:border-gray-700
                           focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              {submitError && <p className="text-red-500 text-xs mt-1">{submitError}</p>}
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="mt-3 px-5 py-2 rounded-lg bg-gold-500 text-white text-sm font-semibold
                           hover:bg-gold-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit review"}
              </button>
            </div>

            {reviewsLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={r.reviewId ?? r.userReviewPkId ?? i} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-gold-500 flex items-center justify-center text-white text-sm font-bold">
                          {(r.userName || r.userId || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate">{r.userName || r.userId}</span>
                      </div>
                      <StarRating value={r.rating} readonly size="w-4 h-4" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 ml-10 break-words">{r.comment}</p>
                    {r.createdAt && (
                      <p className="text-xs text-gray-400 ml-10 mt-1">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Price, actions, seller, safety, location (sticky on desktop) */}
        <div className="space-y-4 min-w-0 md:sticky md:top-24 md:self-start">
          <div className={`${card} p-5`}>
            <div className="flex flex-wrap gap-2 mb-3">
              {isStoreProduct ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30">
                  <Store className="w-3 h-3" /> Store product
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  <MessageCircle className="w-3 h-3" /> Marketplace listing
                </span>
              )}
              {item.isNegotiable && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                  Negotiable
                </span>
              )}
              {viewCount !== null && viewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <Eye className="w-3 h-3" /> {viewCount.toLocaleString("en-IN")} {viewCount === 1 ? "view" : "views"}
                </span>
              )}
            </div>

            <div className="flex justify-between items-start gap-3">
              <p className="text-2xl sm:text-3xl font-bold text-gold-600 dark:text-gold-400 break-all">
                ₹ {Number(item.price).toLocaleString("en-IN")}
              </p>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={handleShare}
                  title="Share"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gold-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {item.id != null && !isOwner && (
                  <button
                    onClick={handleToggleWishlist}
                    disabled={!isInitialized || favLoading}
                    title={favorited ? "Remove from wishlist" : "Add to wishlist"}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    <Heart className={`w-5 h-5 transition ${favorited ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"}`} />
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-base sm:text-lg font-medium mt-2 break-words">{item.title}</h1>
            {stockLeft && (
              <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">In stock · {stockLeft}</p>
            )}
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-gray-500 mt-3">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{item.location || "India"}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{item.date}</span>
            </div>

            {/* Out of stock — replaces buy / chat actions for buyers */}
            {outOfStock && !isOwner && (
              <div className="mt-5 w-full py-3 rounded-xl font-semibold text-center border-2 border-gray-300 dark:border-gray-700 text-gray-500 bg-gray-100 dark:bg-gray-800/60">
                Out of stock
                <p className="mt-0.5 text-xs font-normal">This item is currently unavailable.</p>
              </div>
            )}

            {/* Store actions */}
            {isStoreProduct && !isOwner && !outOfStock && (
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => { if (!alreadyInCart) handleAddToCart(); navigate("/cart"); }}
                  className="w-full py-3 rounded-xl font-semibold bg-gold-500 text-white hover:bg-gold-400 shadow-lg shadow-gold-500/20 transition"
                >
                  Buy now
                </button>
                <button
                  onClick={alreadyInCart ? () => navigate("/cart") : handleAddToCart}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-2 transition
                    ${alreadyInCart
                      ? "border-green-500 text-green-500 hover:bg-green-500/10"
                      : "border-gold-500 text-gold-500 hover:bg-gold-500/10"}`}
                >
                  {addedToCart ? <><CheckCircle className="w-5 h-5" /> Added!</>
                    : alreadyInCart ? <><CheckCircle className="w-5 h-5" /> In cart · View cart</>
                    : <><ShoppingCart className="w-5 h-5" /> Add to cart</>}
                </button>
              </div>
            )}

            {/* Marketplace actions */}
            {!isStoreProduct && !isOwner && !outOfStock && (
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => handleChat()}
                  className="w-full py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-500 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Chat with seller
                </button>

                {item.isNegotiable && (
                  showOffer ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          autoFocus
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOffer()}
                          placeholder="Your offer"
                          className="w-full pl-7 pr-3 py-3 rounded-xl text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <button
                        onClick={handleSendOffer}
                        className="px-4 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-500 transition"
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowOffer(true)}
                      className="w-full py-3 rounded-xl font-semibold border-2 border-green-600 text-green-500 hover:bg-green-600/10 transition flex items-center justify-center gap-2"
                    >
                      <Handshake className="w-5 h-5" /> Make an offer
                    </button>
                  )
                )}
              </div>
            )}

            {/* Share row — store items share on WhatsApp; marketplace listings chat with the owner */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              {isStoreProduct ? (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              ) : (outOfStock && !isOwner) ? null : (
                <button
                  onClick={() => handleChat()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 transition"
                >
                  <MessageCircle className="w-4 h-4" /> {isOwner ? 'Chat' : 'Chat with seller'}
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <Link2 className="w-4 h-4" /> Copy link
              </button>
            </div>
          </div>

          {/* Seller card */}
          <div className={`${card} p-5`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-white font-bold text-lg">
                {sellerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{isStoreProduct ? "Sold by" : "Posted by"}</p>
                <p className="font-semibold truncate flex items-center gap-1">
                  {sellerName}
                  {isStoreProduct && <Store className="w-4 h-4 text-gold-400 flex-shrink-0" />}
                </p>
                {!fromSellerLoading && (
                  <p className="text-xs text-gray-500">
                    {fromSeller.length + 1} active {fromSeller.length === 0 ? "item" : "items"}
                  </p>
                )}
              </div>
            </div>
            {isStoreProduct ? (
              <button
                onClick={() => navigate(`/store/${item.sellerId}`)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gold-500 text-gold-500 text-sm font-medium hover:bg-gold-500/10 transition"
              >
                <Store className="w-4 h-4" /> View store
              </button>
            ) : !isOwner && !outOfStock && (
              <button
                onClick={() => handleChat()}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-600 text-blue-400 text-sm font-medium hover:bg-blue-600/10 transition"
              >
                <MessageCircle className="w-4 h-4" /> Chat with seller
              </button>
            )}
          </div>

          {/* Safety tips (marketplace listings are person-to-person) */}
          {!isStoreProduct && (
            <div className={`${card} p-5`}>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-green-500" /> Stay safe
              </h3>
              <ul className="space-y-2.5">
                {SAFETY_TIPS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Location */}
          {item.location && (
            <div className={`${card} p-5`}>
              <h3 className="font-semibold mb-1">{isStoreProduct ? "Ships from" : "Posted in"}</h3>
              <p className="text-sm text-gray-500">{item.location}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="mt-3 h-44 rounded-xl overflow-hidden">
                  <iframe
                    title="Location map"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    style={{ border: 0, pointerEvents: "none" }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(item.location)}&output=embed`}
                  />
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

      <ProductRow title="Similar products" products={similar} loading={similarLoading} />
      <ProductRow title={`More from ${sellerName}`} products={fromSeller} loading={fromSellerLoading} />
    </div>
  );
}
