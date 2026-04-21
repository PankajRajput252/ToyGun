import { Heart } from "lucide-react";

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
  return (
    
    <div className="bg-white rounded-xl border overflow-hidden relative hover:shadow-md transition">

      <div className="relative">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-48 object-cover"
        />

        <div className="absolute top-3 right-3 bg-black p-2 rounded-full shadow cursor-pointer">
          
            <Heart className="w-5 h-5" />
            
          
        </div>

        {item.featured && (
          <span className="absolute bottom-2 left-2 bg-yellow-400 text-xs px-2 py-1 rounded">
            FEATURED
          </span>
        )}
      </div>

      <div className="p-3 border-l-4 border-yellow-400">
        <h3 className="font-bold text-lg">₹ {item.price}</h3>
        <p className="text-gray-700 text-sm truncate">{item.title}</p>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{item.location}</span>
          <span>{item.date}</span>
        </div>
      </div>
    </div>
  );
}