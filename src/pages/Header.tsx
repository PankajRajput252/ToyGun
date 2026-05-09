import { useState, useRef, useEffect } from "react";
import { Heart, User, Search, MapPin, ChevronDown, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserDropdown from "../components/header/UserDropdown";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./Cartcontext";
import { FaStore } from "react-icons/fa";
 import bandookwaleImage from "../components/images/BackgroundImage.png";
import { useFilter } from "./Filtercontext";
// import bandookwaleImage from "../components/images/BandookwaleLogo.jpeg";

// Popular Indian cities
const INDIAN_CITIES = [
  "All India",
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Coimbatore", "Ludhiana","Peddapuram"
];

export default function Header() {
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  // ── Filter context ──────────────────────────────────────────────────────────
  const { searchQuery, setSearchQuery, selectedCity, setSelectedCity } = useFilter();

  // ── City dropdown state ─────────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCitySearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCities = INDIAN_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setSelectedCity(city === "All India" ? "" : city);
    setDropdownOpen(false);
    setCitySearch("");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#D4A017] via-[#3B2A00] to-[#071426] border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">

        {/* Logo */}
       <div
  className="w-16 h-16 rounded-full overflow-hidden shadow-lg flex-shrink-0 cursor-pointer bg-black flex items-center justify-center"
  onClick={() => navigate("/bandookwale/")}
>
  <img
    src={bandookwaleImage}
    alt="Store Logo"
    className="w-full h-full object-contain"
  />
</div>
        

        {/* ── Location Dropdown ── */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border w-[180px] hover:border-blue-400 transition"
          >
            <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium truncate text-left">
              {selectedCity || "India"}
            </span>
            {selectedCity ? (
              <X
                className="w-4 h-4 text-gray-400 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCity("");
                }}
              />
            ) : (
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            )}
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200
                            rounded-xl shadow-2xl overflow-hidden z-50">
              {/* Search inside dropdown */}
              <div className="p-2 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    autoFocus
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search city..."
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                  />
                </div>
              </div>

              <ul className="max-h-56 overflow-y-auto">
                {filteredCities.map((city) => (
                  <li key={city}>
                    <button
                      onClick={() => handleCitySelect(city)}
                      className={`w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm transition
                        ${
                          (city === "All India" && !selectedCity) || city === selectedCity
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      {city}
                    </button>
                  </li>
                ))}
                {filteredCities.length === 0 && (
                  <li className="px-4 py-4 text-gray-400 text-sm text-center">
                    No cities found
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* ── Search Bar ── */}
        <div className="flex flex-1 items-center bg-white rounded-full border overflow-hidden
                        focus-within:ring-2 focus-within:ring-blue-400 transition">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchQuery("")}
            placeholder="Search here"
            className="flex-1 px-4 py-2 outline-none text-sm"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button className="bg-blue-600 px-4 py-2 hover:bg-blue-700 transition">
            <Search className="text-white w-5 h-5" />
          </button>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-6 ml-4">

          {/* Wishlist */}
          <div
            className="flex flex-col items-center text-sm cursor-pointer text-white hover:text-yellow-300 transition"
            onClick={() => navigate("/bandookwale/wishlistPage")}
          >
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </div>

          {/* Cart */}
          <button
            onClick={() => navigate("/bandookwale/cart")}
            className="relative text-white hover:text-yellow-300 transition"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-white
                               text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>

          {/* Sell Button */}
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold
                       border-2 border-yellow-400 bg-white shadow-md hover:bg-yellow-50 transition"
            onClick={() => navigate("/bandookwale/sellProductPage")}
          >
            <Plus className="w-5 h-5" />
            SELL
          </button>

          {/* Store */}
          <button
            onClick={() => navigate("/bandookwale/store")}
            className="text-white hover:text-yellow-300 transition"
          >
            <FaStore className="w-5 h-5" />
          </button>

          {/* Login / User */}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div
              onClick={() => navigate("/bandookwale/signin")}
              className="flex flex-col items-center text-sm cursor-pointer text-white hover:text-yellow-300 transition"
            >
              <User className="w-5 h-5" />
              <span>Login</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Active filter pills (shown below navbar when filters are on) ── */}
      {/* {(searchQuery || selectedCity) && (
        <div className="flex items-center gap-2 px-6 pb-2">
          {searchQuery && (
            <span className="flex items-center gap-1.5 bg-white/20 text-white
                             text-xs px-3 py-1 rounded-full border border-white/30">
              <Search className="w-3 h-3" />
              "{searchQuery}"
              <button onClick={() => setSearchQuery("")} className="ml-0.5 hover:text-yellow-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCity && (
            <span className="flex items-center gap-1.5 bg-white/20 text-white
                             text-xs px-3 py-1 rounded-full border border-white/30">
              <MapPin className="w-3 h-3" />
              {selectedCity}
              <button onClick={() => setSelectedCity("")} className="ml-0.5 hover:text-yellow-300">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )} */}
    </header>
  );
}