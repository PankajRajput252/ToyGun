import { createContext, useContext, useState, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  location: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  razorpayOrderId: string | null;   // from backend when API is ready
  razorpayPaymentId: string | null; // from Razorpay after payment success
  items: CartItem[];
  totalAmount: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  createdAt: string;
}

interface CartContextType {
  // Cart
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // ─── Cart Actions ───────────────────────────────────────────────────────────
  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setCartItems([]);

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