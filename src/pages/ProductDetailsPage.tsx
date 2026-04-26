import { Heart, Share2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function ProductDetailsPage() {
  const { state } = useLocation();
  const item = state;
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!item) return <div>No product found</div>;

  // Handle both images[] array and fallback
  const images: string[] =
    item.images?.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : ["https://via.placeholder.com/300"];

  const prevImage = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="max-w-7xl mt-20 mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* LEFT SECTION */}
      <div className="md:col-span-2">

        {/* IMAGE CAROUSEL */}
        <div className="bg-black flex justify-center items-center rounded-lg overflow-hidden relative">
          <img
            src={images[currentIndex]}
            alt={item.title}
            className="max-h-[500px] object-contain w-full"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300";
            }}
          />

          {/* Prev / Next buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded text-xl"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded text-xl"
              >
                ›
              </button>
            </>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex ? "bg-yellow-400" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`thumb-${i}`}
                onClick={() => setCurrentIndex(i)}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 ${
                  i === currentIndex
                    ? "border-yellow-400"
                    : "border-transparent"
                }`}
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300";
                }}
              />
            ))}
          </div>
        )}

        {/* DETAILS */}
        <div className="bg-white mt-4 p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Details</h2>

          <div className="flex justify-between border-b pb-3">
            <span className="text-gray-500">Brand</span>
            <span className="font-medium">{item.brand ?? "N/A"}</span>
          </div>

          <h2 className="text-xl font-semibold mt-4">Description</h2>
          <p className="text-gray-700 mt-2">
            {item.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="space-y-4">

        {/* PRICE CARD */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">₹ {item.price}</h1>
            <div className="flex gap-3">
              <Share2 className="cursor-pointer" />
              <Heart className="cursor-pointer" />
            </div>
          </div>
          <p className="text-gray-700 mt-2">{item.title}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-3">
            <span>{item.location}</span>
            <span>{item.date}</span>
          </div>
        </div>

        {/* SELLER CARD */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
              <div>
                <p className="text-sm text-gray-500">Posted By</p>
                <p className="font-semibold">{item.sellerName ?? "Seller"}</p>
                <p className="text-xs text-gray-500">Member since Today</p>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full border-2 border-blue-600 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition">
            Chat with seller
          </button>
        </div>

        {/* LOCATION */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Posted in</h3>
          <p className="text-gray-600">{item.location}</p>
          
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
            target="_blank"
            rel="noopener noreferrer"
          <a>
            <div className="mt-3 h-48 rounded-lg overflow-hidden cursor-pointer">
              <iframe
                width="100%"
                height="100%"
                loading="lazy"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${encodeURIComponent(item.location)}&output=embed`}
              ></iframe>
            </div>
          </a>
        </div>

        {/* FOOTER */}
        <div className="text-xs text-gray-500">
          AD ID {item.id ?? "N/A"}
        </div>
      </div>
    </div>
  );
}