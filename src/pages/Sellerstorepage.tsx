import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Store, Plus } from "lucide-react";
import { sellProductApi } from "../services/api";
import ProductCard from "./ProductCard";
import { Product } from "./ProductCard";
 import storeLogo from "../components/images/storeLogo.png"// adjust path
import bgImage from "../components/images/bg-gun2.jpeg"// adjust path

export default function SellerStorePage() {
  const navigate = useNavigate();
  const { sellerId: sellerIdFromUrl } = useParams<{ sellerId: string }>();

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const loggedInUserId = user?.nodeId;

  // Use sellerId from URL if visiting someone else's store,
  // otherwise use logged-in user's ID
  const sellerId = sellerIdFromUrl || loggedInUserId;
  const isOwnStore = sellerId === loggedInUserId;
  const sellerName = isOwnStore
    ? user?.name || user?.fullName || "My Store"
    : sellerId;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // ─── Fetch store products ─────────────────────────────────────────────────
  const fetchStoreProducts = async () => {
    if (!sellerId) return;
    try {
      setIsLoading(true);
      const response = await sellProductApi.getAll(0, 50, "ACTIVE", sellerId);

      const mapped: Product[] = response.content.map((item: any) => ({
        id: item.productPkId,
        images:
          item.productImageList?.length > 0
            ? item.productImageList
                .map((img: any) => img.profileImageUrl)
                .filter(Boolean)
            : ["https://via.placeholder.com/300"],
        price: item.price,
        title: item.title,
        location: item.location || `${item.city || ""}, ${item.state || ""}`.replace(/^,\s*/, ""),
        date: item.createdDatetime
          ? new Date(item.createdDatetime).toLocaleDateString()
          : "Today",
        description: item.description,
        brand: item.brand || "",
        sellerId: item.sellerId,
        sellerName: item.sellerName || item.sellerId || "Seller",
        isNegotiable: item.negotiable,
        isStoreProduct: true,  // ← ALL products in store page are store products
      }));

      setProducts(mapped);
      setTotalCount(response.totalElements || mapped.length);
    } catch (error) {
      console.error("Error fetching store products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreProducts();
  }, [sellerId]);

  return (
    <div style={{"marginTop":"100px"}} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">

      {/* STORE BANNER */}
      {/* <div className="bg-gradient-to-r from-black to-yellow-500 px-6 py-8"> */}
      <div
  className="px-6 py-8 bg-cover bg-center"
  style={{
    backgroundImage: `url(${bgImage})`,
  }}
>
        <div className="max-w-7xl mx-auto flex items-center gap-5">

          {/* Avatar */}
          {/* <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center
                          text-2xl font-bold text-yellow-500 shadow-lg flex-shrink-0">
            {sellerName.charAt(0).toUpperCase()}
          </div> */}
<div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-lg flex-shrink-0">
  <img
    src={storeLogo}
    alt="Store Logo"
    className="w-full h-full object-cover"
  />
</div>
          {/* Info */}
          <div className="text-white flex-1">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-yellow-300" />
              {/* <h1 className="text-2xl font-bold">{sellerName}'s Store</h1> */}
               <h1 className="text-2xl font-bold">Luthra Gun House Private Limited's Store</h1>
            </div>
            <p className="text-white/70 text-sm mt-1">
              {totalCount} {totalCount === 1 ? "product" : "products"}
            </p>
            <p className="text-white/50 text-xs mt-1">
              🛒 Store products — Add to Cart & Pay via Razorpay
            </p>
          </div>

          {/* Post new ad — own store only */}
          {isOwnStore && (
            <button
              onClick={() => navigate("/bandookwale/sell")}
              className="ml-auto bg-white text-black font-semibold px-4 py-2 rounded-lg
                         hover:bg-yellow-100 transition text-sm flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Post New Ad
            </button>
          )}
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
            <Store className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              {isOwnStore ? "No products in your store yet" : "This store has no products"}
            </h2>
            {isOwnStore && (
              <>
                <p className="text-gray-500 mt-2 mb-6">
                  Post your first product to start selling.
                </p>
                <button
                  onClick={() => navigate("/bandookwale/sell")}
                  className="bg-gradient-to-r from-black to-yellow-500 text-white
                             px-6 py-3 rounded-xl font-medium hover:opacity-90 transition
                             flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Post Your First Product
                </button>
              </>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                {isOwnStore ? "Your Products" : `Products by ${sellerName}`}
              </h2>
              {/* Store badge */}
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1
                               rounded-full border border-yellow-300 font-medium">
                🛒 Cart + Razorpay enabled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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