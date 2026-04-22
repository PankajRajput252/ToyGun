import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Product = {
  image: string;
  price: string | number;
  title: string;
  location: string;
  date: string;
  featured?: boolean;
};

type Props = {
  item: Product;
};

export default function ProductCard({ item }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate("/bandookwale/productdetails", { state: item })
      }
      className="group cursor-pointer p-[2px] rounded-xl bg-gradient-to-r from-black to-yellow-500 
                 bg-[length:200%_200%] bg-left transition-all duration-500 
                 hover:bg-right"
    >
      <div className="bg-white rounded-xl overflow-hidden relative 
                      group-hover:shadow-xl transition duration-300">

        <div className="relative">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
          />

          {/* ❤️ Prevent navigation when clicking heart */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 bg-black p-2 rounded-full shadow cursor-pointer"
          >
            <Heart className="w-5 h-5 text-white group-hover:text-yellow-400 transition" />
          </div>

          {item.featured && (
            <span className="absolute bottom-2 left-2 bg-yellow-400 text-xs px-2 py-1 rounded">
              FEATURED
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-bold text-lg">₹ {item.price}</h3>
          <p className="text-gray-700 text-sm truncate">{item.title}</p>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{item.location}</span>
            <span>{item.date}</span>
          </div>
        </div>

      </div>
    </div>
  );
}