import { useEffect, useState } from "react";
import { useWishlist } from "./Wishlistcontext";
import { sellProductApi } from "../services/api";
import ProductCard, { Product } from "./ProductCard";
import { mapApiToProduct } from "./ProductMapper";
// WishlistPage.tsx
export default function WishlistPage() {
  const { favoritesMap, isInitialized, refreshFavorites } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    // ✅ Re-fetch favorites + products in parallel on every visit
    Promise.all([
      refreshFavorites(),
      sellProductApi
        .getAll(0, 50, "ACTIVE", null)
        .then((res) => setProducts(res.content.map(mapApiToProduct)))
        .catch(console.error),
    ]).finally(() => setProductsLoading(false));
  }, []); // runs every time WishlistPage mounts

  const isLoading = productsLoading || !isInitialized;
  const wishlistedProducts = products.filter((p) => favoritesMap.has(p.id!));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Wishlist ({isLoading ? "..." : wishlistedProducts.length})
      </h1>
      {isLoading ? (
        <div className="text-center py-20">Loading wishlist...</div>
      ) : wishlistedProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          Your wishlist is empty
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}