import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart, ArrowLeft, CheckCircle, Package } from "lucide-react";
import { useCart } from "./Cartcontext";
import { Order } from "./Cartcontext";

// ─── Razorpay type declaration ────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ─── Load Razorpay script dynamically ────────────────────────────────────────
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart, totalItems, totalPrice, addOrder } = useCart();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
  const buyerId = user?.nodeId;
  const buyerName = user?.name || user?.fullName || "Customer";
  const buyerEmail = user?.email || "";
  const buyerPhone = user?.phone || user?.mobile || "";

//   handler: async (razorpayResponse) => {
//   await fetch(`${API_URL}/api/orders/verify`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       razorpay_order_id: razorpayResponse.razorpay_order_id,
//       razorpay_payment_id: razorpayResponse.razorpay_payment_id,
//       razorpay_signature: razorpayResponse.razorpay_signature,
//       customerName: user?.name, email: user?.email, phone: user?.mobile,
//       address: "...", city: "...", state: "...", pincode: "...",
//       subTotal: totalPrice,
//       items: cartItems.map(i => ({ name: i.title, sku: i.id, units: i.quantity, selling_price: i.price }))
//     })
//   });
// }

  // ─── Razorpay Payment Flow ───────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    try {
      setIsOrdering(true);

      // STEP 1: Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert("Failed to load Razorpay. Please check your internet connection.");
        return;
      }

      // STEP 2: Create order on your backend
      // ── When your API is ready, replace this block ────────────────────────
      // const backendOrder = await fetch("http://localhost:5000/api/orders/create", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     buyerId,
      //     amount: totalPrice * 100, // Razorpay expects paise
      //     currency: "INR",
      //     items: cartItems,
      //   }),
      // }).then((r) => r.json());
      //
      // const razorpayOrderId = backendOrder.razorpayOrderId; // from your backend
      // ─────────────────────────────────────────────────────────────────────

      // TEMPORARY: dummy order ID until backend is ready
      const razorpayOrderId: string | null = null;
      const localOrderId = `ORD-${Date.now()}`;

      // STEP 3: Open Razorpay checkout
      const razorpayOptions = {
        // ── Replace with your actual Razorpay Key ID from dashboard ──────────
        key: "rzp_test_Sk36cjHZNLcY5o",
        amount: totalPrice * 100,         // in paise
        currency: "INR",
        name: "Bandookwale",
        description: `Order #${localOrderId}`,
        order_id: razorpayOrderId,        // null until backend is ready
        prefill: {
          name: buyerName,
          email: buyerEmail,
          contact: buyerPhone,
        },
        theme: {
          color: "#EAB308",               // yellow-500 to match your brand
        },

        // ── PAYMENT SUCCESS ────────────────────────────────────────────────
        handler: async (razorpayResponse: any) => {
          console.log("Razorpay success response:", razorpayResponse);

          // STEP 4: Verify payment on your backend
          // ── When your API is ready, replace this block ──────────────────
          // await fetch("http://localhost:5000/api/orders/verify", {
          //   method: "POST",
          //   headers: {
          //     "Content-Type": "application/json",
          //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
          //   },
          //   body: JSON.stringify({
          //     razorpay_order_id: razorpayResponse.razorpay_order_id,
          //     razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          //     razorpay_signature: razorpayResponse.razorpay_signature,
          //   }),
          // });
          // ────────────────────────────────────────────────────────────────

          // Save order locally
          const newOrder: Order = {
            orderId: localOrderId,
            razorpayOrderId: razorpayResponse.razorpay_order_id || null,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id || null,
            items: [...cartItems],
            totalAmount: totalPrice,
            status: "PAID",
            createdAt: new Date().toISOString(),
          };

          addOrder(newOrder);
          clearCart();
          setOrderPlaced(true);
        },

        // ── PAYMENT MODAL DISMISSED ────────────────────────────────────────
        modal: {
          ondismiss: () => {
            console.log("Razorpay modal dismissed by user");
            setIsOrdering(false);
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);

      // ── PAYMENT FAILED ─────────────────────────────────────────────────────
      razorpay.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);

        // Save failed order
        const failedOrder: Order = {
          orderId: localOrderId,
          razorpayOrderId: response.error.metadata?.order_id || null,
          razorpayPaymentId: response.error.metadata?.payment_id || null,
          items: [...cartItems],
          totalAmount: totalPrice,
          status: "FAILED",
          createdAt: new Date().toISOString(),
        };

        addOrder(failedOrder);
        alert(`Payment failed: ${response.error.description}`);
        setIsOrdering(false);
      });

      razorpay.open();

    } catch (error: any) {
      console.error("Order error:", error);
      alert(`Something went wrong: ${error.message || "Please try again."}`);
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
            Payment Successful!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Your order has been placed. The seller will contact you shortly.
          </p>
          <button
            onClick={() => navigate("/bandookwale/orders")}
            className="w-full py-3 rounded-xl text-white font-semibold
                       bg-gradient-to-r from-black to-yellow-500
                       hover:opacity-90 transition mb-3"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate("/bandookwale")}
            className="w-full py-2 rounded-xl border border-gray-300 text-gray-600
                       hover:bg-gray-50 transition text-sm"
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
                       hover:opacity-90 transition mb-3"
          >
            Browse Listings
          </button>
          <button
            onClick={() => navigate("/bandookwale/orders")}
            className="w-full py-2 rounded-xl border border-gray-300 text-gray-600
                       hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" /> View My Orders
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

          {/* My Orders shortcut */}
          <button
            onClick={() => navigate("/bandookwale/orders")}
            className="ml-auto flex items-center gap-1 text-sm text-yellow-600 hover:underline"
          >
            <Package className="w-4 h-4" /> My Orders
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4 mt-10">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex gap-4"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/100";
                  }}
                />
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
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-400 hover:text-red-600 transition flex-shrink-0 self-start"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1 mt-10">
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

              {/* Razorpay note */}
              <p className="text-xs text-gray-400 mt-3 text-center">
                🔒 Secured by Razorpay
              </p>

              <button
                onClick={handlePlaceOrder}
                disabled={isOrdering}
                className="mt-3 w-full py-3 rounded-xl text-white font-semibold
                           bg-gradient-to-r from-black to-yellow-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:opacity-90 transition"
              >
                {isOrdering ? "Opening Payment..." : "Pay with Razorpay"}
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