import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, MessageCircle, Heart, Loader2 } from "lucide-react";
import { useWishlist } from "./Wishlistcontext";

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
}

type Props = {
  item: Product;
};

export default function ProductCard({ item }: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const { toggleFavorite, isFavorited, isLoading,isInitialized  } = useWishlist();

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
    e.stopPropagation(); // prevent card navigation
    if (item.id != null) {
      toggleFavorite(item.id);
    }
  };

  const favorited = item.id != null ? isFavorited(item.id) : false;
  const loading   = item.id != null ? isLoading(item.id)   : false;
  

  return (
    <div
      onClick={() =>
        navigate("/bandookwale/productdetails", { state: item })
      }
      className="group cursor-pointer p-[2px] rounded-xl bg-gradient-to-r from-black to-yellow-500"
    >
      <div className="bg-white rounded-xl overflow-hidden relative">

        {/* IMAGE SECTION */}
        <div className="relative">
          <img
            src={images[index]}
            alt={item.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300";
            }}
          />

          {/* ── STORE / MARKETPLACE BADGE ── */}
          <div className="absolute top-2 left-2">
            {item.isStoreProduct ? (
              <span className="flex items-center gap-1 bg-yellow-500 text-white
                               text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <ShoppingCart className="w-2.5 h-2.5" />
                Store
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-blue-500 text-white
                               text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                <MessageCircle className="w-2.5 h-2.5" />
                Listing
              </span>
            )}
          </div>

          {/* ── WISHLIST HEART BUTTON ── */}
          {item.id != null && (
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
                    favorited
                      ? "fill-red-500 text-red-500"
                      : "text-gray-400 hover:text-red-400"
                  }`}
                />
              )}
            </button>
          )}

          {/* Negotiable badge — shift down if heart is present */}
          {item.isNegotiable && (
            <div className={`absolute ${item.id != null ? "top-10" : "top-2"} right-2`}>
              <span className="bg-green-500 text-white text-[10px] font-bold
                               px-2 py-0.5 rounded-full shadow">
                Negotiable
              </span>
            </div>
          )}

          {/* LEFT BUTTON */}
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 rounded"
            >
              ‹
            </button>
          )}

          {/* RIGHT BUTTON */}
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 rounded"
            >
              ›
            </button>
          )}

          {/* DOTS */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === index ? "bg-yellow-400" : "bg-white"
                  }`}
                />
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

          {/* Bottom action hint */}
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
  );
}