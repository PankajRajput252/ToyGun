import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sellProductApi } from "../services/api";
import ProductCard, { Product } from "./ProductCard";

export default function SellerStorePage() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const userNodeId = user?.nodeId;
  const sellerName = user?.name || user?.fullName || "My Store";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // ─── Fetch seller's own products ─────────────────────────────────────────────
  const fetchSellerProducts = async () => {
    if (!userNodeId) return;

    try {
      setIsLoading(true);

      const response = await sellProductApi.getAll(0, 25, "ACTIVE", userNodeId);

      const mapped: Product[] = response.content.map((item: any) => ({
        images:
          item.productImageList?.length > 0
            ? item.productImageList
                .map((img: any) => img.profileImageUrl)
                .filter(Boolean)
            : ["https://via.placeholder.com/300"],
        price: item.price,
        title: item.title,
        location: `${item.city || ""}, ${item.state || ""}`.replace(/^,\s*/, ""),
        date: item.createdDatetime
          ? new Date(item.createdDatetime).toLocaleDateString()
          : "Today",
        description: item.description,
        sellerName: item.sellerName || sellerName,
        brand: item.brand || "",
      }));

      setProducts(mapped);
      setTotalCount(response.totalElements || mapped.length);
    } catch (error) {
      console.error("Error fetching seller products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{"marginTop":"70px"}} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ">

      {/* STORE HEADER BANNER */}
      <div className="bg-gradient-to-r from-black to-yellow-500 px-6 py-8 ">
        <div className="max-w-7xl mx-auto flex items-center gap-5">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-yellow-500 shadow-lg flex-shrink-0">
            {sellerName.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="text-white">
            <h1 className="text-2xl font-bold">{sellerName}'s Store</h1>
            <p className="text-white/70 text-sm mt-1">
              {totalCount} {totalCount === 1 ? "listing" : "listings"}
            </p>
          </div>

          {/* Post New Ad button */}
          <button
            onClick={() => navigate("/bandookwale/sell")}
            className="ml-auto bg-white text-black font-semibold px-4 py-2 rounded-lg
                       hover:bg-yellow-100 transition text-sm flex-shrink-0"
          >
            + Post New Ad
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              No listings yet
            </h2>
            <p className="text-gray-500 mt-2 mb-6">
              Post your first ad to start selling.
            </p>
            <button
              onClick={() => navigate("/bandookwale/sell")}
              className="bg-gradient-to-r from-black to-yellow-500 text-white
                         px-6 py-3 rounded-xl font-medium hover:opacity-90 transition"
            >
              + Post Your First Ad
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && products.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Your Listings
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {products.map((item, index) => (
                <ProductCard key={index} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}