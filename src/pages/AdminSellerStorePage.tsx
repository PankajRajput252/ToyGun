import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Store, Plus, Package, IndianRupee, Clock, ShieldCheck, Search, ArrowUpDown, UploadCloud, X,
} from "lucide-react";
import { sellProductApi } from "../services/api";
import ProductCard, { type Product } from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { mapProduct, timeAgo } from "./productUtils";
import storeLogo from "../components/images/storeLogo.png";

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

const POST_ITEM_PATH = "/admin/sellProductPage";

type Props = {
  // The public store page reuses this layout but hides the post/upload actions
  allowPosting?: boolean;
};

export default function AdminSellerStorePage({ allowPosting = true }: Props) {
  const navigate = useNavigate();
  const { sellerId: sellerIdFromUrl } = useParams<{ sellerId: string }>();

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const loggedInUserId = user?.nodeId;

  const sellerId = sellerIdFromUrl || loggedInUserId;
  const isOwnStore = sellerId === loggedInUserId;
  const canPost = isOwnStore && allowPosting;
  const sellerName = isOwnStore
    ? user?.name || user?.fullName || "My Store"
    : sellerId;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  // ─── Fetch store products ─────────────────────────────────────────────────
  const fetchStoreProducts = async () => {
    if (!sellerId) return;
    try {
      setIsLoading(true);
      const response = await sellProductApi.getAll(0, 50, "ACTIVE", sellerId, true);

      const mapped: Product[] = response.content.map((item: any) => ({
        ...mapProduct(item),
        isStoreProduct: true,
        // raw fields for edit pre-fill
        categoryId: item.categoryId,
        subcategoryId: item.subcategoryId,
        city: item.city,
        state: item.state,
        zipCode: item.zipCode,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
        productImageList: item.productImageList,
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

  // ─── Remove deleted product from list instantly ───────────────────────────
  const handleProductDeleted = (deletedId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  // ─── Stats for the banner ─────────────────────────────────────────────────
  const stockValue = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const latestCreatedAt = products
    .map((p) => p.createdAt)
    .filter(Boolean)
    .sort()
    .slice(-1)[0];

  const stats = [
    { icon: Package, label: "Products", value: totalCount.toLocaleString("en-IN") },
    { icon: IndianRupee, label: "Stock value", value: `₹${stockValue.toLocaleString("en-IN")}` },
    { icon: Clock, label: "Last added", value: latestCreatedAt ? timeAgo(latestCreatedAt) : "—" },
  ];

  // ─── Search + sort ────────────────────────────────────────────────────────
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q) ||
            p.location?.toLowerCase().includes(q)
        )
      : [...products];

    if (sortBy === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "newest") list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return list;
  }, [products, search, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">

      {/* STORE BANNER */}
      <div className="px-3 sm:px-4 pt-5 sm:pt-6">
        <section
          className="relative overflow-hidden max-w-7xl mx-auto rounded-3xl border border-gray-800
                     bg-gradient-to-br from-gray-950 via-gray-900 to-black"
        >
          <div className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 w-[28rem] h-[28rem] rounded-full bg-gold-600/10 blur-3xl" />

          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              {/* Logo with gold ring */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-lg shadow-gold-500/20 flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-black">
                    <img src={storeLogo} alt="Store logo" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold-300 bg-gold-500/15 border border-gold-500/30 px-2.5 py-0.5 rounded-full">
                      <Store className="w-3 h-3" /> {isOwnStore ? "Your store" : "Store"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-300 bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Cart enabled{/* Cart + Razorpay enabled */}
                    </span>
                  </div>
                  <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-white break-words">
                    Luthra Gun House Private Limited's Store
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">Customers add these items to cart and pay securely.{/* via Razorpay */}</p>
                </div>
              </div>

              {canPost && (
                <button
                  onClick={() => navigate(POST_ITEM_PATH)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                             bg-gold-500 text-white hover:bg-gold-400 shadow-lg shadow-gold-500/25 transition flex-shrink-0"
                >
                  <Plus className="w-4 h-4" /> Post new item
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl px-3 py-3 sm:px-4 sm:py-4 bg-white/5 border border-white/10 backdrop-blur-sm min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400">
                    <Icon className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                  <p className="mt-1 text-base sm:text-xl font-bold text-white truncate">
                    {isLoading ? <span className="inline-block h-5 w-16 rounded bg-white/10 animate-pulse align-middle" /> : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Toolbar */}
        {(isLoading || products.length > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
              {isOwnStore ? "Your products" : `Products by ${sellerName}`}
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-gray-400">({visibleProducts.length})</span>
              )}
            </h2>

            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your products"
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  aria-label="Sort products"
                  className="appearance-none pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500 cursor-pointer"
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <option key={key} value={key}>{SORT_LABELS[key]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty store */}
        {!isLoading && products.length === 0 && (
          <div className="max-w-lg mx-auto mt-6 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 px-6 py-14 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gold-500/15 flex items-center justify-center">
              <Store className="w-8 h-8 text-gold-400" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-gray-800 dark:text-gray-100">
              {isOwnStore ? "Your store is empty" : "This store has no products"}
            </h2>
            {canPost && (
              <>
                <p className="text-sm text-gray-500 mt-2 mb-6">Upload your first product with photos, price and details to start selling.</p>
                <button
                  onClick={() => navigate(POST_ITEM_PATH)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gold-500 hover:bg-gold-400 shadow-lg shadow-gold-500/25 transition"
                >
                  <UploadCloud className="w-5 h-5" /> Upload your first product
                </button>
              </>
            )}
          </div>
        )}

        {/* No search results */}
        {!isLoading && products.length > 0 && visibleProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-500">No products match "{search}"</p>
            <button onClick={() => setSearch("")} className="mt-3 text-sm text-gold-500 hover:underline">
              Clear search
            </button>
          </div>
        )}

        {/* Products Grid — "upload" tile first on your own store */}
        {!isLoading && visibleProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {canPost && !search && (
              <button
                onClick={() => navigate(POST_ITEM_PATH)}
                className="group min-h-[260px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700
                           hover:border-gold-500 hover:bg-gold-500/5 transition flex flex-col items-center justify-center gap-3 p-4 text-center"
              >
                <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gold-500/15 text-gold-400
                                 group-hover:bg-gold-500 group-hover:text-white group-hover:scale-110 transition">
                  <UploadCloud className="w-7 h-7" />
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">Upload new item</span>
                <span className="text-xs text-gray-500 max-w-[12rem]">Add photos, price and details for a new store product</span>
              </button>
            )}
            {visibleProducts.map((item, index) => (
              <ProductCard key={item.id ?? index} item={item} onDeleted={handleProductDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
