import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronDown, Heart, ShoppingCart, Plus, X } from "lucide-react";
import { useFilter } from "./Filtercontext"; 

// Popular Indian cities for the dropdown
const INDIAN_CITIES = [
  "All Cities",
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Coimbatore", "Ludhiana",
];

export default function Navbar() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, selectedCity, setSelectedCity } = useFilter();

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCities = INDIAN_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const displayCity = selectedCity || "India";

  const handleCitySelect = (city: string) => {
    setSelectedCity(city === "All Cities" ? "" : city);
    setCityDropdownOpen(false);
    setCitySearch("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setSearchQuery("");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-900 to-yellow-600
                    border-b border-yellow-500/20 shadow-xl">
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-2xl mx-auto">

        {/* ── LOGO ── */}
        <button
          onClick={() => navigate("/bandookwale")}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30
                     flex items-center justify-center text-yellow-400 font-bold text-lg hover:bg-yellow-500/20 transition"
        >
          🔫
        </button>

        {/* ── CITY DROPDOWN ── */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            onClick={() => setCityDropdownOpen((v) => !v)}
            className="flex items-center gap-2 bg-white/10 border border-white/20 text-white
                       rounded-full px-3 py-2 text-sm hover:bg-white/15 transition min-w-[120px]"
          >
            <MapPin className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <span className="truncate max-w-[80px]">{displayCity}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${
                cityDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown panel */}
          {cityDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 border border-yellow-500/30
                            rounded-xl shadow-2xl overflow-hidden z-50">
              {/* City search inside dropdown */}
              <div className="p-2 border-b border-white/10">
                <input
                  autoFocus
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city..."
                  className="w-full bg-white/10 text-white placeholder-gray-400 text-sm
                             rounded-lg px-3 py-1.5 outline-none border border-white/10 focus:border-yellow-500/50"
                />
              </div>
              <ul className="max-h-52 overflow-y-auto">
                {filteredCities.map((city) => (
                  <li key={city}>
                    <button
                      onClick={() => handleCitySelect(city)}
                      className={`w-full text-left px-4 py-2 text-sm transition
                        ${
                          (city === "All Cities" && !selectedCity) || city === selectedCity
                            ? "bg-yellow-500/20 text-yellow-400 font-medium"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {city}
                    </button>
                  </li>
                ))}
                {filteredCities.length === 0 && (
                  <li className="px-4 py-3 text-gray-500 text-sm text-center">No cities found</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="flex-1 flex items-center bg-white rounded-full overflow-hidden
                        border-2 border-transparent focus-within:border-yellow-400 transition shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search here"
            className="flex-1 px-4 py-2 text-sm text-gray-800 outline-none bg-transparent"
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
          <button className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2.5 flex items-center">
            <Search className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Wishlist */}
          <button
            onClick={() => navigate("/bandookwale/wishlist")}
            className="flex flex-col items-center text-white hover:text-yellow-400 transition group"
          >
            <Heart className="w-5 h-5 group-hover:fill-yellow-400/20" />
            <span className="text-[10px] mt-0.5 text-gray-400 group-hover:text-yellow-400">Wishlist</span>
          </button>

          {/* Cart */}
          <button className="text-white hover:text-yellow-400 transition">
            <ShoppingCart className="w-5 h-5" />
          </button>

          {/* Sell button */}
          <button
            onClick={() => navigate("/bandookwale/sell")}
            className="flex items-center gap-1.5 bg-white text-gray-900 font-semibold
                       text-sm px-4 py-2 rounded-full hover:bg-yellow-400 transition shadow"
          >
            <Plus className="w-4 h-4" />
            SELL
          </button>
        </div>
      </div>

      {/* ── Active filter pills ── */}
      {(searchQuery || selectedCity) && (
        <div className="flex items-center gap-2 px-4 pb-2">
          {searchQuery && (
            <span className="flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30
                             text-blue-300 text-xs px-3 py-1 rounded-full">
              <Search className="w-3 h-3" />
              "{searchQuery}"
              <button onClick={() => setSearchQuery("")} className="hover:text-white ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCity && (
            <span className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/30
                             text-yellow-300 text-xs px-3 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {selectedCity}
              <button onClick={() => setSelectedCity("")} className="hover:text-white ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </nav>
  );
}