import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Share2, ShoppingCart, CheckCircle, MessageCircle, Store } from "lucide-react";
import { useCart } from "./Cartcontext";

export default function ProductDetailsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const item = state;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  if (!item) return <div className="p-10 text-center text-gray-500">No product found</div>;

  // ─── Image handling ───────────────────────────────────────────────────────
  const images: string[] =
    item.images?.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : ["https://via.placeholder.com/300"];

  const prevImage = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  // ─── Determine product type ───────────────────────────────────────────────
  // isStoreProduct: true  → e-commerce (cart + razorpay)
  // isStoreProduct: false → marketplace (chat + wishlist)
  const isStoreProduct = item.isStoreProduct === true;

  // ─── Cart logic (store products only) ────────────────────────────────────
  const cartId = item.id?.toString() || `${item.title}-${item.location}`;
  const alreadyInCart = cartItems.some((c) => c.id === cartId);

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

  // ─── Chat handler (marketplace products only) ─────────────────────────────
  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");

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

  return (
    <div className="max-w-7xl mt-20 mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* LEFT — Images + Details */}
      <div className="md:col-span-2">

        {/* Product Type Badge */}
        <div className="mb-3">
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
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded text-xl"
              >‹</button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded text-xl"
              >›</button>
            </>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-yellow-400" : "bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`thumb-${i}`}
                onClick={() => setCurrentIndex(i)}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 ${
                  i === currentIndex ? "border-yellow-400" : "border-transparent"
                }`}
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/300"; }}
              />
            ))}
          </div>
        )}

        {/* Details */}
        <div className="bg-white mt-4 p-4 rounded-lg border">
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
      </div>

      {/* RIGHT — Price + Actions */}
      <div className="space-y-4">

        {/* Price Card */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">₹ {Number(item.price).toLocaleString()}</h1>
            <div className="flex gap-3">
              <button title="Share">
                <Share2 className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black transition" />
              </button>

              {/* Wishlist — marketplace only */}
              {!isStoreProduct && (
                <button
                  onClick={() => setWishlisted(!wishlisted)}
                  title="Wishlist"
                >
                  <Heart
                    className={`w-5 h-5 cursor-pointer transition ${
                      wishlisted ? "fill-red-500 text-red-500" : "text-gray-500 hover:text-red-500"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-700 mt-2">{item.title}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-3">
            <span>{item.location}</span>
            <span>{item.date}</span>
          </div>

          {/* ── STORE PRODUCT ACTIONS ── */}
          {isStoreProduct && (
            <div className="mt-4 space-y-2">
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={alreadyInCart}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition
                  ${alreadyInCart
                    ? "bg-green-500 text-white cursor-default"
                    : "bg-gradient-to-r from-black to-yellow-500 text-white hover:opacity-90"
                  }`}
              >
                {addedToCart ? (
                  <><CheckCircle className="w-5 h-5" /> Added to Cart!</>
                ) : alreadyInCart ? (
                  <><CheckCircle className="w-5 h-5" /> Already in Cart</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                )}
              </button>

              {/* View Cart */}
              {alreadyInCart && (
                <button
                  onClick={() => navigate("/bandookwale/cart")}
                  className="w-full py-2 rounded-xl border-2 border-yellow-500 text-yellow-600
                             font-medium hover:bg-yellow-50 transition text-sm"
                >
                  View Cart →
                </button>
              )}

              {/* Buy Now (direct to cart + checkout) */}
              <button
                onClick={() => {
                  handleAddToCart();
                  setTimeout(() => navigate("/bandookwale/cart"), 300);
                }}
                disabled={alreadyInCart}
                className="w-full py-3 rounded-xl border-2 border-black text-black
                           font-semibold hover:bg-black hover:text-white transition
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          )}

          {/* ── MARKETPLACE PRODUCT ACTIONS ── */}
          {!isStoreProduct && (
            <div className="mt-4 space-y-2">
              {/* Chat with Seller */}
              <button
                onClick={handleChat}
                className="w-full py-3 rounded-xl border-2 border-blue-600 text-blue-600
                           font-semibold hover:bg-blue-600 hover:text-white transition
                           flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Chat with Seller
              </button>

              {/* Wishlist toggle */}
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className={`w-full py-3 rounded-xl border-2 font-semibold transition
                  flex items-center justify-center gap-2
                  ${wishlisted
                    ? "border-red-400 bg-red-50 text-red-500"
                    : "border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"
                  }`}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500" : ""}`} />
                {wishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>
          )}
        </div>

        {/* Seller Card */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {(item.sellerName || item.sellerId || "S").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {isStoreProduct ? "Sold by" : "Posted By"}
              </p>
              <p className="font-semibold">{item.sellerName || item.sellerId || "Seller"}</p>
              <p className="text-xs text-gray-500">Member since Today</p>
            </div>
          </div>

          {/* Store products — view store link */}
          {isStoreProduct && (
            <button
              onClick={() => navigate(`/bandookwale/store/${item.sellerId}`)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg
                         border border-yellow-400 text-yellow-600 text-sm font-medium
                         hover:bg-yellow-50 transition"
            >
              <Store className="w-4 h-4" /> View Store
            </button>
          )}

          {/* Marketplace products — chat button */}
          {!isStoreProduct && (
            <button
              onClick={handleChat}
              className="mt-4 w-full border-2 border-blue-600 text-blue-600 py-2 rounded-lg
                         font-medium hover:bg-blue-600 hover:text-white transition"
            >
              Chat with seller
            </button>
          )}
        </div>

        {/* Location */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">
            {isStoreProduct ? "Ships from" : "Posted in"}
          </h3>
          <p className="text-gray-600">{item.location}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="mt-3 h-48 rounded-lg overflow-hidden cursor-pointer">
              <iframe
                width="100%"
                height="100%"
                loading="lazy"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${encodeURIComponent(item.location)}&output=embed`}
              />
            </div>
          </a>
        </div>

        <div className="text-xs text-gray-500">AD ID {item.id ?? "N/A"}</div>
      </div>
    </div>
  );
}