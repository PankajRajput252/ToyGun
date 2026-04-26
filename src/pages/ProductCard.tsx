import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export interface Product {
  images: string[];
  price: number;
  title: string;
  location: string;
  date: string;
}
type Props = {
  item: Product;
};

export default function ProductCard({ item }: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const images = item.images.length
    ? item.images
    : ["https://via.placeholder.com/300"];

  const nextImage = (e: any) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: any) => {
    e.stopPropagation();
    setIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <div
      onClick={() =>
        navigate("/bandookwale/productdetails", { state: item })
      }
      className="group cursor-pointer p-[2px] rounded-xl bg-gradient-to-r from-black to-yellow-500"
    >
      <div className="bg-white rounded-xl overflow-hidden relative">

        {/* IMAGE SECTION */}
        <div className="relative">
          <img
            src={images[index]}
            alt={item.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/300";
            }}
          />

          {/* LEFT BUTTON */}
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 rounded"
            >
              ‹
            </button>
          )}

          {/* RIGHT BUTTON */}
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 rounded"
            >
              ›
            </button>
          )}

          {/* DOTS */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === index ? "bg-yellow-400" : "bg-white"
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-3">
          <h3 className="font-bold text-lg">₹ {item.price}</h3>
          <p className="text-gray-700 text-sm truncate">
            {item.title}
          </p>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{item.location}</span>
            <span>{item.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}