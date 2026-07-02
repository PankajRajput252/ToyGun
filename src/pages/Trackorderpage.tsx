import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Search, Truck, CheckCircle, ArrowLeft } from "lucide-react";

const API_URL = "https://api.bandookwale.in";

interface TrackingResult {
  status?: string;
  courierName?: string;
  awbCode?: string;
  currentStatus?: string;
  trackingEvents?: { date: string; status: string; location?: string }[];
}

export default function TrackOrderPage() {
  const navigate = useNavigate();
  const [shipmentId, setShipmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleTrack = async () => {
    if (!shipmentId.trim()) {
      setError("Please enter a shipment ID");
      return;
    }

    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/shiprocket/track/${shipmentId.trim()}`);
      const data = await res.json();

      if (data.status === "ERROR") {
        setError(data.message || "Could not find tracking information.");
        return;
      }

      console.log("Tracking response:", data);
      setResult(data);
    } catch (err) {
      console.error("Tracking error:", err);
      setError("Failed to fetch tracking information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTrack();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-black transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-yellow-500" />
            Track Your Order
          </h1>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipment ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your shipment ID"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5
                         focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            />
            <button
              onClick={handleTrack}
              disabled={isLoading}
              className="px-5 bg-gradient-to-r from-black to-yellow-500 text-white
                         rounded-lg font-medium hover:opacity-90 transition
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Track
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {result.currentStatus || result.status || "In Transit"}
                </p>
                {result.courierName && (
                  <p className="text-sm text-gray-500">via {result.courierName}</p>
                )}
              </div>
            </div>

            {result.awbCode && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5 flex justify-between items-center">
                <span className="text-sm text-gray-500">AWB Number</span>
                <span className="font-mono text-sm font-semibold text-gray-800">
                  {result.awbCode}
                </span>
              </div>
            )}

            {/* Timeline */}
            {result.trackingEvents && result.trackingEvents.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">Tracking History</p>
                {result.trackingEvents.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-yellow-500" : "bg-gray-300"}`} />
                      {i < result.trackingEvents!.length - 1 && (
                        <div className="w-px h-8 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium text-gray-800">{event.status}</p>
                      {event.location && (
                        <p className="text-xs text-gray-400">{event.location}</p>
                      )}
                      <p className="text-xs text-gray-400">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !error && !isLoading && (
          <div className="text-center py-10">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Enter your shipment ID above to see live tracking updates
            </p>
          </div>
        )}

      </div>
    </div>
  );
}