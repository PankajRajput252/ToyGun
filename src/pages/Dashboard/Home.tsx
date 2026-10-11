import React, { useEffect, useState, useMemo } from "react";
import Footer from "../../components/footer/Footer";
import CategoryFilterBar from "../CategoryFilterBar";
import CategoryGrid from "../CategoryGrid";
import { useNavigate } from "react-router-dom";
import ProductCard, { type Product } from "../ProductCard";
import { mapProduct, fetchProductsByCategory } from "../productUtils";
import ProductCardSkeleton from "../ProductCardSkeleton";
import { getRecentlyViewed } from "../recentlyViewed";
import { sellProductApi } from "../../services/api";
import { useFilter } from "../Filtercontext";
import {
  ShoppingCart, MessageCircle, LayoutGrid, PlusCircle, Store, History, Loader2, ShieldCheck,
  Search, Handshake, Lock, Truck,
} from "lucide-react";
import HeroCarousel3D from "../HeroCarousel3D";
import heroImg1 from "../../components/images/hero/scroll_1.jpg";
import heroImg2 from "../../components/images/hero/scroll_2.jpg";
import heroImg3 from "../../components/images/hero/scroll_3.jpg";
import heroImg6 from "../../components/images/hero/scroll_6.jpg";
import heroImg7 from "../../components/images/hero/scroll_7.jpg";

export type { Product };

type Tab = "all" | "store" | "listing";

const PAGE_SIZE = 24;

// Web-sized copies of the scroll_N originals (see components/images/hero)
const HERO_IMAGES = [heroImg1, heroImg6, heroImg2, heroImg7, heroImg3];

const HOW_IT_WORKS = [
  { icon: Search, title: "Find it", text: "Browse categories or search for exactly what you want, near you." },
  { icon: MessageCircle, title: "Chat or add to cart", text: "Talk to sellers to negotiate, or buy store products in one click." },
  { icon: Handshake, title: "Get it", text: "Meet the seller safely, or get store orders delivered to your door." },
];

const TRUST_POINTS = [
  { icon: Store, title: "Seller stores", text: "Shop from sellers with their own store page and catalogue." },
  { icon: Lock, title: "Secure payments", text: "Store checkout is handled by Razorpay." },
  { icon: Truck, title: "Order tracking", text: "Follow your store orders from dispatch to delivery." },
  { icon: ShieldCheck, title: "Safety first", text: "Meet in public and inspect before you pay for listings." },
];

export default function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [recentlyViewed] = useState<Product[]>(() => getRecentlyViewed<Product>());
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // ── Pull search & city from shared context (set by Navbar) ──────────────────
  const { searchQuery, selectedCity } = useFilter();

  // ─── Fetch ALL products (page 0 replaces the list, later pages append) ────────
  const fetchAllProducts = async (pageToLoad = 0) => {
    const isFirstPage = pageToLoad === 0;
    try {
      isFirstPage ? setIsLoading(true) : setIsLoadingMore(true);
      const response = await sellProductApi.getAll(pageToLoad, PAGE_SIZE, "ACTIVE", null, false);
      const mapped = response.content.map(mapProduct);
      setAllProducts((prev) => (isFirstPage ? mapped : [...prev, ...mapped]));
      setPage(pageToLoad);
      const loadedSoFar = pageToLoad * PAGE_SIZE + mapped.length;
      setHasMore(
        response.totalElements > 0
          ? loadedSoFar < response.totalElements
          : mapped.length === PAGE_SIZE
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      isFirstPage ? setIsLoading(false) : setIsLoadingMore(false);
    }
  };

  // ─── Fetch products by CATEGORY ─────────────────────────────────────────────
  const fetchByCategory = async (categoryId: number) => {
    try {
      setIsLoading(true);
      setAllProducts(await fetchProductsByCategory(categoryId));
      setHasMore(false); // category view loads everything in one request
    } catch (error) {
      console.error("Error fetching category products:", error);
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Apply tab + search + city filters on top of allProducts ────────────────
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    // 1. Tab filter
    if (activeTab === "store")   list = list.filter((p) => p.isStoreProduct === true);
    if (activeTab === "listing") list = list.filter((p) => p.isStoreProduct !== true);

    // 2. Search filter — match title, brand, or description (case-insensitive)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // 3. City filter — match location field (case-insensitive)
    if (selectedCity) {
      const city = selectedCity.toLowerCase();
      list = list.filter((p) => p.location?.toLowerCase().includes(city));
    }

    return list;
  }, [allProducts, activeTab, searchQuery, selectedCity]);

  // ─── Tab counts (after tab filter only, so badge reflects what's in that tab) ─
  const storeCount   = allProducts.filter((p) => p.isStoreProduct === true).length;
  const listingCount = allProducts.filter((p) => p.isStoreProduct !== true).length;

  // ─── Handle category selection ───────────────────────────────────────────────
  const handleSelectCategory = (categoryId: number | null, categoryName?: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName || "");
    if (categoryId === null) {
      setShowGrid(true);
      fetchAllProducts(0);
    } else {
      setShowGrid(false);
      fetchByCategory(categoryId);
    }
  };

  useEffect(() => {
    fetchAllProducts(0);
  }, []);

  const scrollToProducts = () =>
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ─── Tab config ─────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all",     label: "All",      icon: <LayoutGrid className="w-3.5 h-3.5" />,     count: allProducts.length },
    { key: "listing", label: "Listings", icon: <MessageCircle className="w-3.5 h-3.5" />,  count: listingCount },
    { key: "store",   label: "Store",    icon: <ShoppingCart className="w-3.5 h-3.5" />,   count: storeCount },
  ];

  // ─── Active filter summary label ────────────────────────────────────────────
  const filterLabel = [
    selectedCategoryName,
    selectedCity ? `📍 ${selectedCity}` : "",
    searchQuery   ? `🔍 "${searchQuery}"` : "",
  ]
    .filter(Boolean)
    .join(" · ") || "All Products";

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
          {/* Hero — only on the unfiltered home view */}
          {showGrid && !searchQuery && (
            <section className="relative overflow-hidden mx-4 md:mx-8 mt-6 rounded-3xl border border-gray-800
                                bg-gradient-to-br from-gray-950 via-gray-900 to-black">
              {/* Soft gold light behind the content */}
              <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 right-0 w-[32rem] h-[32rem] rounded-full bg-gold-600/15 blur-3xl" />
              <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center gap-6 lg:gap-4 px-6 py-10 sm:px-10 sm:py-14 md:py-16">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider
                                 text-gold-300 bg-gold-500/15 border border-gold-500/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Bandookwale Marketplace
                </span>
                <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white">
                  Buy, sell &amp; collect —{" "}
                  <span className="text-gold-400">all in one place</span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-lg">
                  Shop store products or chat directly with sellers near you to get the best deal.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => { setActiveTab("store"); scrollToProducts(); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                               bg-gold-500 text-white hover:bg-gold-400 shadow-lg shadow-gold-500/25 transition"
                  >
                    <Store className="w-4 h-4" />
                    Shop the store
                  </button>
                  <button
                    onClick={() => navigate("/bandookwale/sellProductPage")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                               bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Sell an item
                  </button>
                </div>
              </div>

              <HeroCarousel3D images={HERO_IMAGES} />
              </div>
            </section>
          )}

          {/* Category Grid */}
          {showGrid && (
            <CategoryGrid
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
            />
          )}
          {/* Recently viewed — horizontal swipe row */}
          {showGrid && recentlyViewed.length > 0 && (
            <section className="mx-4 md:mx-8 mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                <History className="w-5 h-5 text-gold-500" />
                Recently viewed
              </h2>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
                {recentlyViewed.map((item) => (
                  <div key={item.id} className="w-40 sm:w-52 flex-shrink-0 snap-start">
                    <ProductCard item={item} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Products Section */}
          <div id="products" className="mx-4 md:mx-8 my-8 scroll-mt-24">
            {/* ── TABS + HEADING ROW ── */}
            <div className="mt-8 md:mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

              {/* Section heading */}
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {filterLabel}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({filteredProducts.length})
                </span>
              </h2>

              {/* Tabs */}
              <div className="flex items-center self-start sm:self-auto max-w-full overflow-x-auto bg-white dark:bg-gray-800 border
                              border-gray-200 dark:border-gray-700 rounded-xl p-1 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center flex-shrink-0 whitespace-nowrap gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm
                                font-medium transition-all duration-200
                                ${activeTab === tab.key
                                  ? tab.key === "store"
                                    ? "bg-gold-500 text-white shadow-sm"
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
                        ? tab.key === "all"
                          ? "bg-gray-900/10 text-gray-900 dark:bg-gray-900/10 dark:text-gray-900"
                          : "bg-white/20 text-white"
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
                              dark:border-yellow-800 px-3 py-2 rounded-lg w-fit max-w-full">
                <ShoppingCart className="w-3.5 h-3.5" />
                Store products — Add to cart and pay via Razorpay
              </div>
            )}
            {activeTab === "listing" && (
              <div className="mb-4 flex items-center gap-2 text-xs text-blue-700
                              bg-blue-50 dark:bg-blue-900/20 border border-blue-200
                              dark:border-blue-800 px-3 py-2 rounded-lg w-fit max-w-full">
                <MessageCircle className="w-3.5 h-3.5" />
                Marketplace listings — Chat with seller to negotiate
              </div>
            )}

            {/* Loading — skeleton cards in the same grid shape */}
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-4xl mb-3">
                  {searchQuery ? "🔍" : selectedCity ? "📍" : activeTab === "store" ? "🛒" : activeTab === "listing" ? "💬" : "📭"}
                </p>
                <p className="text-gray-500 text-base font-medium">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : selectedCity
                    ? `No products in ${selectedCity}`
                    : activeTab === "store"
                    ? "No store products found"
                    : activeTab === "listing"
                    ? "No marketplace listings found"
                    : `No products found${selectedCategoryName ? ` in "${selectedCategoryName}"` : ""}`}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchQuery || selectedCity
                    ? "Try adjusting your search or location filter"
                    : activeTab !== "all"
                    ? 'Try switching to the "All" tab'
                    : selectedCategoryId
                    ? "Try a different category"
                    : ""}
                </p>
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((item, index) => (
                  <ProductCard key={item.id ?? index} item={item} />
                ))}
              </div>
            )}

            {/* Load more */}
            {!isLoading && hasMore && !selectedCategoryId && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchAllProducts(page + 1)}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                             border border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-white
                             disabled:opacity-60 transition"
                >
                  {isLoadingMore ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
                  ) : (
                    "Load more products"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* How it works + trust — only on the unfiltered home view */}
          {showGrid && !searchQuery && (
            <section className="mx-4 md:mx-8 mt-16 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
                How <span className="text-gold-400">Bandookwale</span> works
              </h2>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {HOW_IT_WORKS.map(({ icon: Icon, title, text }, i) => (
                  <div
                    key={title}
                    className="relative rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                  >
                    <span className="absolute top-4 right-5 text-5xl font-bold text-gray-100 dark:text-gray-800 select-none">
                      {i + 1}
                    </span>
                    <div className="relative w-12 h-12 rounded-xl flex items-center justify-center bg-gold-500/15 text-gold-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="relative mt-4 font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <p className="relative mt-1 text-sm text-gray-500 dark:text-gray-400">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-gray-900 to-gray-800/60 border border-gray-800"
                  >
                    <Icon className="w-6 h-6 text-gold-400" />
                    <h3 className="mt-3 text-sm sm:text-base font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400">{text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Footer />
        </div>
      </main>
    </div>
  );
}