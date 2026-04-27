import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { Order } from "./Cartcontext";

const STATUS_STYLES: Record<Order["status"], string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  FAILED: "bg-red-100 text-red-600 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  PAID: "✅ Payment Successful",
  PENDING: "⏳ Payment Pending",
  FAILED: "❌ Payment Failed",
  CANCELLED: "🚫 Order Cancelled",
};

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state as Order | null;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Order not found.</p>
          <button
            onClick={() => navigate("/bandookwale/orders")}
            className="mt-4 text-yellow-600 hover:underline text-sm"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/bandookwale/orders")}
            className="text-gray-500 hover:text-black dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Order Details
          </h1>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl border p-4 mb-5 ${STATUS_STYLES[order.status]}`}>
          <p className="font-semibold text-base">{STATUS_LABEL[order.status]}</p>
          <p className="text-sm mt-1 opacity-80">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 mb-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Order Info
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono text-gray-800 dark:text-white">
                {order.orderId}
              </span>
            </div>
            {order.razorpayOrderId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Razorpay Order ID</span>
                <span className="font-mono text-gray-800 dark:text-white text-xs">
                  {order.razorpayOrderId}
                </span>
              </div>
            )}
            {order.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-mono text-gray-800 dark:text-white text-xs">
                  {order.razorpayPaymentId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 mb-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Items ({order.items.length})
          </h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover border flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/64";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.location}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty: {item.quantity}
                    </p>
                  )}
                </div>
                <p className="font-bold text-gray-900 dark:text-white flex-shrink-0">
                  ₹ {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 mb-6">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Price Summary
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹ {order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-green-500 font-medium">Free</span>
            </div>
          </div>
          <div className="border-t dark:border-gray-700 mt-3 pt-3 flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total Paid</span>
            <span>₹ {order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
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