import { Heart, User, Search, MapPin, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserDropdown from "../components/header/UserDropdown";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./Cartcontext";
import { FaStore } from "react-icons/fa";
import navbarBg from "../components/images/bg-gun2.jpeg"// adjust path




export default function Header() {
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();

  const navigate = useNavigate();
  return (
     <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-black to-yellow-500 border-b">
  
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">

        {/* Logo */}
        <div className="text-3xl font-bold text-[#002f34]" onClick={() => navigate("/bandookwale/")}>
          BandookWale
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border w-[220px]">
          <MapPin className="w-5 h-5 text-blue-500" />
          <span className="flex-1 text-sm font-medium">India</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>

        {/* Search */}
        <div className="flex flex-1 items-center bg-white rounded-full border overflow-hidden">
          <input
            type="text"
            placeholder='Search here'
            className="flex-1 px-4 py-2 outline-none text-sm"
          />
          <button className="bg-blue-600 px-4 py-2">
            <Search className="text-white w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 ml-4">

          {/* Wishlist */}
          <div className="flex flex-col items-center text-sm cursor-pointer" onClick={() => navigate("/bandookwale/wishlistPage")} >
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </div>
          <button onClick={() => navigate("/bandookwale/cart")} className="relative">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-white 
                     text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>

          {/* Sell Button */}
          <button className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold border-2 border-yellow-400 bg-white shadow-md"
            onClick={() => navigate("/bandookwale/sellProductPage")}>
            <Plus className="w-5 h-5" />
            SELL
          </button>

          <button onClick={() => navigate("/bandookwale/store")}>
            <FaStore />
          </button>

          {/* Login */}
          {
            isAuthenticated ? <UserDropdown /> : <div
              onClick={() => navigate("/bandookwale/signin")} // ✅ route here
              className="flex flex-col items-center text-sm cursor-pointer"
            >
              <User className="w-5 h-5" />
              <span>Login</span>
            </div>
          }




        </div>
      </div>
    </header>
  );
}