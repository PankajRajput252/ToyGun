import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react";
import { useCart } from "./Cartcontext ";

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // ─── Place Order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
    const sellerId = user?.nodeId;

    const orderPayload = {
      buyerId: sellerId,
      items: cartItems.map((item) => ({
        productId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalAmount: totalPrice,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    console.log("Order payload (ready for API):", orderPayload);

    try {
      setIsOrdering(true);

      // ── When your order API is ready, replace this with: ──────────────────
      // const response = await orderApi.placeOrder(orderPayload);
      // ─────────────────────────────────────────────────────────────────────

      // Simulate API delay for now
      await new Promise((res) => setTimeout(res, 1500));

      clearCart();
      setOrderPlaced(true);
    } catch (error: any) {
      console.error("Order failed:", error);
      alert(`Order failed: ${error.message || "Please try again."}`);
    } finally {
      setIsOrdering(false);
    }
  };

  // ─── Order Success Screen ─────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 flex flex-col items-center max-w-md w-full text-center">
          <CheckCircle className="text-green-500 w-20 h-20 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Order Placed!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Your order has been placed successfully. The seller will contact you shortly.
          </p>
          <button
            onClick={() => navigate("/bandookwale")}
            className="w-full py-3 rounded-xl text-white font-semibold
                       bg-gradient-to-r from-black to-yellow-500
                       hover:opacity-90 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty Cart ───────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 flex flex-col items-center max-w-md w-full text-center">
          <ShoppingCart className="text-gray-300 w-20 h-20 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Browse listings and add items to your cart.
          </p>
          <button
            onClick={() => navigate("/bandookwale")}
            className="w-full py-3 rounded-xl text-white font-semibold
                       bg-gradient-to-r from-black to-yellow-500
                       hover:opacity-90 transition"
          >
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  // ─── Cart Page ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-black dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            My Cart
            <span className="ml-2 text-base font-normal text-gray-500">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex gap-4"
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/100";
                  }}
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{item.location}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                    ₹ {(item.price * item.quantity).toLocaleString()}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400">
                      ₹ {item.price.toLocaleString()} × {item.quantity}
                    </p>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-600 transition flex-shrink-0 self-start"
                  title="Remove from cart"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-5 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Items ({totalItems})</span>
                  <span>₹ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="text-green-500 font-medium">Free</span>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 mt-4 pt-4 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>₹ {totalPrice.toLocaleString()}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isOrdering}
                className="mt-5 w-full py-3 rounded-xl text-white font-semibold
                           bg-gradient-to-r from-black to-yellow-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:opacity-90 transition"
              >
                {isOrdering ? "Placing Order..." : "Place Order"}
              </button>

              <button
                onClick={clearCart}
                className="mt-3 w-full py-2 rounded-xl text-red-500 border border-red-300
                           hover:bg-red-50 transition text-sm font-medium"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}