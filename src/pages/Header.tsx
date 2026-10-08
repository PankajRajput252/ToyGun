import { useState, useRef, useEffect } from "react";
import { Heart, User, Search, MapPin, ChevronDown, Plus, X, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserDropdown from "../components/header/UserDropdown";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./Cartcontext";
import { FaStore } from "react-icons/fa";
// import bandookwaleImage from "../components/images/BackgroundImage.png";
import { useFilter } from "./Filtercontext";
// import bandookwaleImage from "../components/images/BandookwaleLogo.jpeg";
import bandookwaleImage from "../components/images/bandg.png";
import storeImg from "../components/images/storeImg1.jpg"
import storeNewImg from "../components/images/StoreNewLogo.jpeg"
import Finallogo from "../components/images/Finallogo.jpeg"

// Popular Indian cities
const INDIAN_CITIES = [
  "All India",
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Coimbatore", "Ludhiana", "Peddapuram"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleMobileNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    // <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#D4A017] via-[#3B2A00] to-[#071426] border-b">
    // <header className="fixed top-0 left-0 w-full z-50 bg-[#f5b301] border-b border-[#d89c00]">
    // <header className="fixed top-0 left-0 w-full z-50 bg-slate-900 border-b border-slate-700 shadow-lg">
    // <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-500/20 shadow-lg">
    <header className="sticky top-0 w-full z-50 bg-[#111827] border-b-2 border-[#f5b301] shadow-lg">
      <div className="max-w-7xl mx-auto px-3 py-2 lg:px-6 lg:py-3 flex flex-wrap lg:flex-nowrap items-center gap-x-2 gap-y-1 lg:gap-4">

        {/* Logo */}
        <div
          className="order-1 w-12 h-12 lg:w-16 lg:h-16 rounded-full overflow-hidden shadow-lg flex-shrink-0 cursor-pointer flex items-center justify-center bg-black"
          onClick={() => navigate("/bandookwale/")}
        >
          <img
            src={bandookwaleImage}
            alt="Store Logo"
            className="w-full h-full object-contain"
          />
        </div>


        {/* ── Location Dropdown ── */}
        {/* Forces location + search onto a second row below lg */}
        <div className="order-3 basis-full h-0 lg:hidden" />

        <div ref={dropdownRef} className="relative flex-shrink-0 order-4 lg:order-2">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 bg-white px-3 lg:px-4 py-2 rounded-full border w-[120px] sm:w-[180px] hover:border-blue-400 transition"
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
                  <Search className="bg-slate-800 text-white border border-slate-600" />
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
                        ${(city === "All India" && !selectedCity) || city === selectedCity
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
        <div className="order-5 lg:order-3 flex flex-1 min-w-0 items-center bg-white rounded-full border overflow-hidden
                        focus-within:ring-2 focus-within:ring-blue-400 transition">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchQuery("")}
            placeholder="Search here"
            className="flex-1 min-w-0 px-3 lg:px-4 py-2 outline-none text-sm"
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
          <button className="bg-blue-600 px-3 lg:px-4 py-2 hover:bg-blue-700 transition">
            <Search className="text-white w-5 h-5" />
          </button>
        </div>

        {/* ── Actions ── */}
        {/* ── Actions ── */}
        <div className="order-2 lg:order-4 flex items-center gap-3 sm:gap-4 lg:gap-7 ml-auto lg:ml-4">

          {/* Wishlist */}
          <div
            className="hidden lg:flex flex-col items-center text-sm cursor-pointer text-white hover:text-amber-400 hover:scale-110 transition duration-200"
            onClick={() => navigate("/bandookwale/wishlistPage")}
          >
            <Heart
              className="w-7 h-7 drop-shadow-md"
              strokeWidth={2.5}
            />
            <span className="font-semibold mt-1">Wishlist</span>
          </div>

          {/* Cart */}
          <button
            onClick={() => navigate("/bandookwale/cart")}
            className="relative text-white hover:text-amber-400 hover:scale-110 transition duration-200"
          >
            <ShoppingCart
              className="w-7 h-7 lg:w-8 lg:h-8 drop-shadow-md"
              strokeWidth={2.5}
            />

            {totalItems > 0 && (
              <span
                className="absolute -top-2 -right-2 bg-amber-500 text-black
                 text-xs rounded-full min-w-[20px] h-5 px-1
                 flex items-center justify-center font-bold shadow"
              >
                {totalItems}
              </span>
            )}
          </button>

          {/* Sell Button */}
          <button
            className="hidden sm:flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 rounded-full
               font-bold text-black bg-white border-2 border-black
               shadow-lg hover:scale-105 hover:bg-gray-100 transition duration-200"
            onClick={() => navigate("/bandookwale/sellProductPage")}
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            SELL
          </button>

         

          {/* Login / User */}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div
              onClick={() => navigate("/bandookwale/signin")}
              className="flex flex-col items-center text-sm cursor-pointer text-black hover:scale-110 transition duration-200"
            >
              <User
                className="w-7 h-7 drop-shadow-md"
                strokeWidth={2.5}
              />
              <span className="font-semibold mt-1">Login</span>
            </div>
          )}

           {/* Store */}
          <button
            className="hidden lg:block"
            onClick={() => navigate("/bandookwale/store")}
          // className="text-black hover:scale-110 transition duration-200"
          // className="hover:scale-110 transition duration-200"
          >
            <img
              src={Finallogo}
              alt="Store"
               className="w-15 h-15 rounded-full object-cover"
              // className="w-15 h-15 rounded-full object-cover animate-pulse"
              // className="w-16 h-16 rounded-full object-cover animate-bounce"
              // className="store-attention w-15 h-15 rounded-full object-cover"
            />
          </button>

          {/* Mobile / tablet menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:text-amber-400 hover:bg-white/10 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile / tablet menu (items hidden from the bar below lg) ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 px-3 pb-3 pt-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleMobileNav("/bandookwale/wishlistPage")}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-white font-semibold text-sm hover:bg-white/10 hover:text-amber-400 transition"
            >
              <Heart className="w-5 h-5" strokeWidth={2.5} />
              Wishlist
            </button>
            <button
              onClick={() => handleMobileNav("/bandookwale/sellProductPage")}
              className="sm:hidden flex items-center gap-3 w-full px-3 py-3 rounded-lg text-white font-semibold text-sm hover:bg-white/10 hover:text-amber-400 transition"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              SELL
            </button>
            <button
              onClick={() => handleMobileNav("/bandookwale/store")}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-white font-semibold text-sm hover:bg-white/10 hover:text-amber-400 transition"
            >
              <img src={Finallogo} alt="Store" className="w-7 h-7 rounded-full object-cover" />
              Store
            </button>
          </div>
        </div>
      )}

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