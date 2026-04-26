import { useState } from "react";
import { Heart } from "lucide-react";

import stngl from "../components/images/stngr-llc.jpg"
import stngl2 from "../components/images/stngr-llc2.jpg"
import thomas from "../components/images/thomas-tucker.jpg"
import mossbery from "../components/images/Mossbery 590.jpg"



type WishlistItem = {
  id: string;
  image: string;
  price: number;
  title: string;
  location: string;
  year: number;
  km: number;
  isElite?: boolean;
};

const dummyData: WishlistItem[] = [
  {
    id: "1",
    image: stngl2,
    price: 45000,
    title: "Honda Activa 2019",
    location: "Delhi",
    year: 2019,
    km: 30500,
  },
  {
    id: "2",
    image: thomas,
    price: 36450,
    title: "TVS Scooty Pep+",
    location: "Bangalore",
    year: 2017,
    km: 29820,
  },
  {
    id: "3",
    image:  stngl,
    price: 32000,
    title: "TVS Jupiter 110",
    location: "Mumbai",
    year: 2017,
    km: 23000,
  },
  {
    id: "4",
    image: mossbery,
    price: 7900000,
    title: "Toyota Vellfire",
    location: "Hyderabad",
    year: 2020,
    km: 33000,
    isElite: true,
  },
];

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<string[]>(
    dummyData.map((item) => item.id)
  );

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-2xl font-semibold mb-6">Wishlist</h1>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {dummyData.map((item) => (
          <div
            key={item.id}
            className="group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white"
          >
            {/* Image */}
            <div className="relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-48 object-cover"
              />

              {/* Heart Icon */}
              <button
                onClick={() => toggleWishlist(item.id)}
                className="absolute top-3 right-3 bg-white p-2 rounded-full shadow"
              >
                <Heart
                  className={`w-5 h-5 ${
                    wishlist.includes(item.id)
                      ? "fill-red-500 text-red"
                      : "text-gray-500"
                  }`}
                />
              </button>

              {/* Elite Badge */}
              {item.isElite && (
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  ELITE
                </span>
              )}
            </div>

            {/* Details */}
            <div className="p-4">
              <h2 className="text-lg font-bold">
                ₹ {item.price.toLocaleString()}
              </h2>

              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {item.year} • {item.km.toLocaleString()} km
              </p>

              <p className="text-sm font-medium mt-1 line-clamp-1">
                {item.title}
              </p>

              <p className="text-xs text-gray-500 mt-2">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}