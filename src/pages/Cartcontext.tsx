import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { cartApi, type CartResponse } from "../services/cartApi";
import PLACEHOLDER_IMAGE from "../components/images/BandookwaleLogo.jpeg";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  title: string;
  /** Unit price the buyer pays (sale price when a discount is live). */
  price: number;
  /** List price before a sale discount; shown struck through in the cart. */
  originalPrice?: number;
  image: string;
  location: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  // razorpayOrderId: string | null;   // from backend when API is ready
  // razorpayPaymentId: string | null; // from Razorpay after payment success
  items: CartItem[];
  totalAmount: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  createdAt: string;
}

interface CartContextType {
  // Cart
  cartItems: CartItem[];
  /** Saves to the server when logged in; throws with a message to show if it fails. */
  addToCart: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  /** true while the logged-in cart is being loaded from the server */
  isCartLoading: boolean;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
}

// ─── Guest cart (not logged in) — kept in the browser, moved to the server on login ──

const GUEST_CART_KEY = "bw_guest_cart";

const readGuestCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: CartItem[]) => {
  try {
    if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    else localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* storage blocked — the guest cart just won't survive a reload */
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => (isAuthenticated ? [] : readGuestCart()));
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Photos the browser already had, used when the server has none for a product
  const knownImages = useRef<Record<string, string>>({});

  // Server cart → the shape the cart page already uses. Sold-out lines are left out of the
  // list and totals (the server keeps them, so they come back when restocked).
  const applyServerCart = useCallback((res: CartResponse) => {
    setCartItems(
      res.items
        .filter((l) => l.available)
        .map((l) => {
          const id = String(l.productId);
          return {
            id,
            title: l.title,
            price: Number(l.unitPrice),
            originalPrice: l.originalUnitPrice != null ? Number(l.originalUnitPrice) : Number(l.unitPrice),
            image: l.image || knownImages.current[id] || PLACEHOLDER_IMAGE,
            location: l.location || "India",
            quantity: l.quantity,
          };
        })
    );
  }, []);

  // ─── Load on login / reset on logout ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setCartItems(readGuestCart());
      return;
    }
    let cancelled = false;
    (async () => {
      setIsCartLoading(true);
      try {
        // Move anything added while logged out into the account's cart first
        const guest = readGuestCart();
        for (const g of guest) {
          const productId = Number(g.id);
          if (!Number.isFinite(productId)) continue;
          if (g.image) knownImages.current[g.id] = g.image;
          try {
            await cartApi.add(productId, g.quantity);
          } catch (err) {
            // e.g. sold out or removed since — skip that one, keep the rest
            console.warn(`Could not move "${g.title}" to your cart:`, err);
          }
        }
        if (guest.length) writeGuestCart([]);

        const res = await cartApi.get();
        if (!cancelled) applyServerCart(res);
      } catch (err) {
        console.error("Failed to load cart:", err);
      } finally {
        if (!cancelled) setIsCartLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, applyServerCart]);

  // ─── Cart Actions ───────────────────────────────────────────────────────────
  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    if (item.image) knownImages.current[item.id] = item.image;

    if (isAuthenticated) {
      const productId = Number(item.id);
      if (!Number.isFinite(productId)) throw new Error("This product can't be added to the cart.");
      applyServerCart(await cartApi.add(productId, 1));
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
      writeGuestCart(next);
      return next;
    });
  };

  const removeFromCart = async (id: string) => {
    if (isAuthenticated) {
      applyServerCart(await cartApi.remove(Number(id)));
      return;
    }
    setCartItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      writeGuestCart(next);
      return next;
    });
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        applyServerCart(await cartApi.clear());
      } catch (err) {
        // Still empty it on screen (e.g. right after an order); the next load will resync
        console.error("Failed to clear cart on the server:", err);
        setCartItems([]);
      }
      return;
    }
    writeGuestCart([]);
    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ─── Order Actions ──────────────────────────────────────────────────────────
  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]); // newest first
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        isCartLoading,
        orders,
        addOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
