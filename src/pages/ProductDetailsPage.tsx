import { Heart, Share2 } from "lucide-react";
import { useLocation } from "react-router-dom";

type Props = {
  item: {
    image: string;
    price: number | string;
    title: string;
    location: string;
    date: string;
    brand: string;
    description: string;
    sellerName: string;
  };
};

export default function ProductDetailsPage() {
  const { state } = useLocation();

  const item = state;

  if (!item) return <div>No product found</div>;
  return (
    <div className="max-w-7xl mt-20 mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* LEFT SECTION */}
      <div className="md:col-span-2">

        {/* IMAGE */}
        <div className="bg-black flex justify-center items-center rounded-lg overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="max-h-[500px] object-contain"
          />
        </div>

        {/* DETAILS */}
        <div className="bg-white mt-4 p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Details</h2>

          <div className="flex justify-between border-b pb-3">
            <span className="text-gray-500">Brand</span>
            <span className="font-medium">{item.brand}</span>
          </div>

          <h2 className="text-xl font-semibold mt-4">Description</h2>
          <h4 className="text-xl font-semibold mt-4">"Get Exciting Offers!!
            TVS Ntorq 125 - TVS Ntorq 125 – Ride Ahead with Power, Style, and Technology!
            The Ntorq 125 is one of the most value for money scooters in the market. The scooter offers some outstanding features, and performance for a price that makes it an enticing scooter. But the best aspect is its sport styling that many young Indians relate to. Engine Capacity: 124.8 cc
            Mileage - ARAI: 48.5 kmpl
            Kerb Weight: 118 kg
            S         eat Height: 770 mm
            Fuel Tank Capacity: 5.8 litres
            Max Power: 9.25 bhp"</h4>
          <p className="text-gray-700 mt-2">{item.description}</p>
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
                <p className="font-semibold">{item.sellerName}</p>
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

          {/* MAP PLACEHOLDER */}
          {/* <div className="mt-3 h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
            Map View
          </div> */}
          {/* <div className="mt-3 h-48 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${encodeURIComponent(item.location)}&output=embed`}
            ></iframe>
          </div> */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
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
          AD ID 1841220543
        </div>
      </div>
    </div>
  );
}