import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { favoriteApi } from "../services/api";

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
export const USER_ID = user?.nodeId;

export type Favorite = {
  favoritesPkId: number;
  userFkId: string;
  productFkId: number;
  createdAt: string | null;
};

type WishlistCtx = {
  favoritesMap: Map<number, Favorite>;
  loadingIds: Set<number>;
  isInitialized: boolean;
  toggleFavorite: (productFkId: number) => Promise<void>;
  isFavorited: (productFkId: number) => boolean;
  isLoading: (productFkId: number) => boolean;
    refreshFavorites: () => Promise<void>; // ✅ add this line

};

const WishlistContext = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [favoritesMap, setFavoritesMap] = useState<Map<number, Favorite>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!USER_ID) return;

    favoriteApi
      .getByUser(USER_ID)
      .then((favs) => {
        const map = new Map<number, Favorite>();
        favs.forEach((f) => map.set(f.productFkId, f));
        setFavoritesMap(map);
      })
      .catch(console.error)
      .finally(() => setIsInitialized(true));
  }, []);

  const setItemLoading = (id: number, val: boolean) =>
    setLoadingIds((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });

  const toggleFavorite = useCallback(
    async (productFkId: number) => {
      if (!USER_ID || loadingIds.has(productFkId) || !isInitialized) return;

      setItemLoading(productFkId, true);

      try {
        if (favoritesMap.has(productFkId)) {
          const existing = favoritesMap.get(productFkId);

          if (!existing?.favoritesPkId) return;

          await favoriteApi.delete(existing.favoritesPkId);

          setFavoritesMap((prev) => {
            const next = new Map(prev);
            next.delete(productFkId);
            return next;
          });
        } else {
          const newFav = await favoriteApi.add(USER_ID, productFkId);

          setFavoritesMap((prev) => {
            const next = new Map(prev);
            next.set(productFkId, newFav);
            return next;
          });
        }
      } catch (err) {
        console.error("Wishlist toggle failed:", err);
      } finally {
        setItemLoading(productFkId, false);
      }
    },
    [favoritesMap, loadingIds, isInitialized]
  );

  type WishlistCtx = {
  favoritesMap: Map<number, Favorite>;
  loadingIds: Set<number>;
  isInitialized: boolean;
  toggleFavorite: (productFkId: number) => Promise<void>;
  isFavorited: (productFkId: number) => boolean;
  isLoading: (productFkId: number) => boolean;
  refreshFavorites: () => Promise<void>; // ✅ add this
};

// inside WishlistProvider:
const refreshFavorites = useCallback(async () => {
  if (!USER_ID) return;
  setIsInitialized(false); // show loading while refreshing
  try {
    const favs = await favoriteApi.getByUser(USER_ID);
    const map = new Map<number, Favorite>();
    favs.forEach((f) => map.set(f.productFkId, f));
    setFavoritesMap(map);
  } catch (err) {
    console.error("Failed to refresh favorites:", err);
  } finally {
    setIsInitialized(true);
  }
}, []);
  return (
    <WishlistContext.Provider
      value={{
        favoritesMap,
        loadingIds,
        isInitialized,
        refreshFavorites,
        toggleFavorite,
        isFavorited: (id) => favoritesMap.has(id),
        isLoading: (id) => loadingIds.has(id),
        
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}