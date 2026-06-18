
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Store, Plus, ShoppingCart, Package, MapPin, Star,
  SlidersHorizontal, ChevronDown, CheckCircle2
} from "lucide-react";
import { sellProductApi } from "../services/api";
import ProductCard from "./ProductCard";
import { Product } from "./ProductCard";
import storeLogo from "../components/images/storeLogo.png";

export default function SellerStorePage() {
  const navigate = useNavigate();
  const { sellerId: sellerIdFromUrl } = useParams<{ sellerId: string }>();

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const loggedInUserId = user?.nodeId;
  const sellerId = sellerIdFromUrl || loggedInUserId;
  const isOwnStore = sellerId === loggedInUserId;
  const sellerName = isOwnStore
    ? user?.name || user?.fullName || "My Store"
    : "Luthra Gun House Private Limited";

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"products" | "about" | "reviews">("products");

  const fetchStoreProducts = async () => {
    if (!sellerId) return;
    try {
      setIsLoading(true);
      const response = await sellProductApi.getAll(0, 50, "ACTIVE", null);
      const mapped: Product[] = response.content
        .filter((item: any) => item.isStoreProduct === true)
        .map((item: any) => ({
          id: item.productPkId,
          images:
            item.productImageList?.length > 0
              ? item.productImageList.map((img: any) => img.profileImageUrl).filter(Boolean)
              : ["https://via.placeholder.com/300"],
          price: item.price,
          title: item.title,
          location:
            item.location ||
            `${item.city || ""}, ${item.state || ""}`.replace(/^,\s*/, ""),
          date: item.createdDatetime
            ? new Date(item.createdDatetime).toLocaleDateString()
            : "Today",
          description: item.description,
          brand: item.brand || "",
          sellerId: item.sellerId,
          sellerName: item.sellerName || item.sellerId || "Seller",
          isNegotiable: item.negotiable,
          isStoreProduct: true,
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
    <div className="min-h-screen bg-[#0e0e0e]" style={{ marginTop: "64px" }}>

      {/* ── STORE HERO ── */}
      <div className="relative bg-[#111] border-b border-[#1e1e1e] overflow-hidden">
        {/* Subtle diagonal pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #c9931a 0, #c9931a 1px, transparent 0, transparent 50%)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-7 flex items-center gap-5">
          {/* Store logo */}
          <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-[#c9931a] flex-shrink-0 shadow-lg flex items-center justify-center">
            <img
              src={storeLogo}
              alt="Store Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          {/* Store info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-white leading-tight">
                {sellerName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#1d3a22] text-[#5dca6e]">
                <CheckCircle2 className="w-3 h-3" />
                Verified store
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#888]">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#c9931a]" />
                {totalCount} {totalCount === 1 ? "product" : "products"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#c9931a]" />
                Hyderabad, India
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#c9931a] fill-[#c9931a]" />
                4.8 rating
              </span>
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#0d2140] text-[#4a9eff] border border-[#1d4880]">
              <ShoppingCart className="w-3.5 h-3.5" />
              Razorpay enabled
            </div>
            {isOwnStore && (
              <button
                onClick={() => navigate("/bandookwale/sell")}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg
                           bg-[#c9931a] text-white hover:bg-[#b8821a] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-0 border-t border-[#1e1e1e]">
          {(["products", "about", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#c9931a] text-[#c9931a]"
                  : "border-transparent text-[#666] hover:text-[#999]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTER ROW ── */}
      {activeTab === "products" && (
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-1.5 text-xs text-[#c9931a] bg-[#2a1f06] border border-[#c9931a]/40 px-3 py-1.5 rounded-full font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            All items
          </div>
          {["Holsters", "Accessories", "Ammunition"].map((f) => (
            <button
              key={f}
              className="text-xs text-[#888] bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 rounded-full hover:border-[#c9931a]/40 hover:text-[#c9931a] transition-colors"
            >
              {f}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-1.5 text-xs text-[#888] bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-[#333] transition-colors">
            Sort: Latest
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-2 border-[#c9931a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && activeTab === "products" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-5">
              <Store className="w-9 h-9 text-[#444]" />
            </div>
            <h2 className="text-lg font-semibold text-[#ccc]">
              {isOwnStore ? "No products in your store yet" : "This store has no products"}
            </h2>
            {isOwnStore && (
              <>
                <p className="text-[#666] text-sm mt-2 mb-6">
                  Post your first product to start selling.
                </p>
                <button
                  onClick={() => navigate("/bandookwale/sell")}
                  className="flex items-center gap-2 bg-[#c9931a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#b8821a] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post Your First Product
                </button>
              </>
            )}
          </div>
        )}

        {/* Products grid */}
        {!isLoading && products.length > 0 && activeTab === "products" && (
          <>
            <p className="text-sm text-[#555] mb-4">
              {totalCount} {totalCount === 1 ? "result" : "results"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((item, i) => (
                <ProductCard key={i} item={item} />
              ))}
            </div>
          </>
        )}

        {/* About tab placeholder */}
        {activeTab === "about" && (
          <div className="py-12 text-center text-[#555] text-sm">Store details coming soon.</div>
        )}

        {/* Reviews tab placeholder */}
        {activeTab === "reviews" && (
          <div className="py-12 text-center text-[#555] text-sm">Reviews coming soon.</div>
        )}
      </div>
    </div>
  );
}

