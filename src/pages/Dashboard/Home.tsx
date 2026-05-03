import React, { useEffect, useState, useMemo } from "react";
import Footer from "../../components/footer/Footer";
import CategoryFilterBar from "../CategoryFilterBar";
import CategoryGrid from "../CategoryGrid";
import ProductCard from "../ProductCard";
import { sellProductApi } from "../../services/api";
import { ShoppingCart, MessageCircle, LayoutGrid } from "lucide-react";

export interface Product {
  images: string[];
  price: number;
  title: string;
  location: string;
  date: string;
  isNegotiable?: boolean;
  id?: number;
  sellerId?: string;
  sellerName?: string;
  description?: string;
  brand?: string;
  isStoreProduct?: boolean;
}

type Tab = "all" | "store" | "listing";

const API_URL = "http://bandookWale.eba-55irbrg4.ap-south-1.elasticbeanstalk.com";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // raw full list
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // ─── Map raw API item → Product ───────────────────────────────────────────────
  const mapProduct = (item: any): Product => ({
    id: item.productPkId,
    images:
      item.productImageList?.length > 0
        ? item.productImageList
            .map((img: any) => img.profileImageUrl)
            .filter(Boolean)
        : ["https://via.placeholder.com/300"],
    price: item.price,
    title: item.title,
    location:
      item.location ||
      `${item.city || ""}, ${item.state || ""}`.replace(/^,\s*/, ""),
    date: item.createdDatetime
      ? new Date(item.createdDatetime).toLocaleDateString()
      : "Today",
    sellerId: item.sellerId,
    sellerName: item.sellerName || item.sellerId || "Seller",
    description: item.description,
    brand: item.brand || "",
    isNegotiable: item.negotiable,
    isStoreProduct: item.isStoreProduct,
  });

  // ─── Fetch ALL products ───────────────────────────────────────────────────────
  const fetchAllProducts = async () => {
    try {
      setIsLoading(true);
      const response = await sellProductApi.getAll(0, 25, "ACTIVE", null);
      setAllProducts(response.content.map(mapProduct));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fetch products by CATEGORY ──────────────────────────────────────────────
  const fetchByCategory = async (categoryId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${API_URL}/api/users/getProduct?filterBy=ACTIVE&page=0&size=200&inputPkId=null&inputFkId=null&searchValue=null&categoryId=${categoryId}`
      );
      const data = await res.json();
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
        ? data
        : [];
      setAllProducts(list.map(mapProduct));
    } catch (error) {
      console.error("Error fetching category products:", error);
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Tab filter applied on top of allProducts ─────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (activeTab === "store") return allProducts.filter((p) => p.isStoreProduct === true);
    if (activeTab === "listing") return allProducts.filter((p) => p.isStoreProduct !== true);
    return allProducts;
  }, [allProducts, activeTab]);

  // ─── Tab counts ───────────────────────────────────────────────────────────────
  const storeCount   = allProducts.filter((p) => p.isStoreProduct === true).length;
  const listingCount = allProducts.filter((p) => p.isStoreProduct !== true).length;

  // ─── Handle category selection ────────────────────────────────────────────────
  const handleSelectCategory = (categoryId: number | null, categoryName?: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName || "");
    if (categoryId === null) {
      setShowGrid(true);
      fetchAllProducts();
    } else {
      setShowGrid(false);
      fetchByCategory(categoryId);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  // ─── Tab config ───────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "all",
      label: "All",
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      count: allProducts.length,
    },
    {
      key: "store",
      label: "Store",
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      count: storeCount,
    },
    {
      key: "listing",
      label: "Listings",
      icon: <MessageCircle className="w-3.5 h-3.5" />,
      count: listingCount,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100
                    dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">

      {/* Category Filter Bar */}
      <CategoryFilterBar
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      <main>
        <div>
          {/* Category Grid */}
          {showGrid && (
            <CategoryGrid
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {/* Products Section */}
          <div className="mx-8 my-8">

            {/* ── TABS + HEADING ROW ── */}
            <div style={{"marginTop":"100px"}} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

              {/* Section heading */}
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                {selectedCategoryId && selectedCategoryName
                  ? `${selectedCategoryName}`
                  : "All Products"}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({filteredProducts.length})
                </span>
              </h2>

              {/* Tabs */}
              <div className="flex items-center bg-white dark:bg-gray-800 border
                              border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                                font-medium transition-all duration-200
                                ${activeTab === tab.key
                                  ? tab.key === "store"
                                    ? "bg-yellow-500 text-white shadow-sm"
                                    : tab.key === "listing"
                                    ? "bg-blue-500 text-white shadow-sm"
                                    : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                      ${activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Back to all categories */}
              {selectedCategoryId && (
                <button
                  onClick={() => handleSelectCategory(null)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 self-start"
                >
                  ← All Categories
                </button>
              )}
            </div>

            {/* Active tab description */}
            {activeTab === "store" && (
              <div className="mb-4 flex items-center gap-2 text-xs text-yellow-700
                              bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200
                              dark:border-yellow-800 px-3 py-2 rounded-lg w-fit">
                <ShoppingCart className="w-3.5 h-3.5" />
                Store products — Add to cart and pay via Razorpay
              </div>
            )}
            {activeTab === "listing" && (
              <div className="mb-4 flex items-center gap-2 text-xs text-blue-700
                              bg-blue-50 dark:bg-blue-900/20 border border-blue-200
                              dark:border-blue-800 px-3 py-2 rounded-lg w-fit">
                <MessageCircle className="w-3.5 h-3.5" />
                Marketplace listings — Chat with seller to negotiate
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-4xl mb-3">
                  {activeTab === "store" ? "🛒" : activeTab === "listing" ? "💬" : "🔍"}
                </p>
                <p className="text-gray-500 text-base font-medium">
                  {activeTab === "store"
                    ? "No store products found"
                    : activeTab === "listing"
                    ? "No marketplace listings found"
                    : `No products found${selectedCategoryName ? ` in "${selectedCategoryName}"` : ""}`}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab !== "all"
                    ? "Try switching to the \"All\" tab"
                    : selectedCategoryId
                    ? "Try a different category"
                    : ""}
                </p>
                <div className="flex gap-2 mt-4">
                  {activeTab !== "all" && (
                    <button
                      onClick={() => setActiveTab("all")}
                      className="text-sm text-yellow-600 border border-yellow-400
                                 px-4 py-2 rounded-lg hover:bg-yellow-50 transition"
                    >
                      View all products
                    </button>
                  )}
                  {selectedCategoryId && (
                    <button
                      onClick={() => handleSelectCategory(null)}
                      className="text-sm text-blue-600 border border-blue-300
                                 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                    >
                      All categories
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {filteredProducts.map((item, index) => (
                  <ProductCard key={index} item={item} />
                ))}
              </div>
            )}
          </div>

          <Footer />
        </div>
      </main>
    </div>
  );
}