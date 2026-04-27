import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "./Cartcontext";
import { Order } from "./Cartcontext";

const STATUS_STYLES: Record<Order["status"], string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  PAID: "✅ Paid",
  PENDING: "⏳ Pending",
  FAILED: "❌ Failed",
  CANCELLED: "🚫 Cancelled",
};

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { orders } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-black dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-yellow-500" />
            My Orders
          </h1>
        </div>

        {/* Empty state */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-400 mb-6">
              Items you purchase will appear here.
            </p>
            <button
              onClick={() => navigate("/bandookwale")}
              className="bg-gradient-to-r from-black to-yellow-500 text-white
                         px-6 py-3 rounded-xl font-medium hover:opacity-90 transition
                         flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Start Shopping
            </button>
          </div>
        )}

        {/* Orders list */}
        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.orderId}
                onClick={() =>
                  navigate(`/bandookwale/orders/${order.orderId}`, { state: order })
                }
                className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700
                           shadow-sm p-4 cursor-pointer hover:shadow-md transition"
              >
                {/* Order header row */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">
                      {order.orderId}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[order.status]}`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                {/* Product thumbnails */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {order.items.map((item, i) => (
                    <img
                      key={i}
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 rounded-lg object-cover border flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/56";
                      }}
                    />
                  ))}
                </div>

                {/* Items summary + total */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                    {order.items.map((i) => i.title).join(", ")}
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white ml-4 flex-shrink-0">
                    ₹ {order.totalAmount.toLocaleString()}
                  </p>
                </div>

                <p className="text-xs text-yellow-600 mt-2 text-right">
                  View Details →
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}