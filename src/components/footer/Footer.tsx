export default function Footer() {
  return (
    <footer className="w-full mt-10 bg-[#0b0b0b] text-gray-300">

      {/* Top Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 text-sm">

          {/* Brand / About column (wider feel via heading) */}
          <div className="col-span-2 lg:col-span-1 lg:pr-4">
            <h2 className="text-white font-bold text-lg tracking-tight mb-3">
              Bandook<span className="text-yellow-500">Wale</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              India's trusted marketplace for licensed firearms, antiques &
              shooting accessories.
            </p>
            <div className="flex gap-3">
              {[
                { label: "Facebook", icon: "f", href: "https://www.facebook.com/sourabh.luthra.395?mibextid=LQQJ4d" },
                { label: "Instagram", icon: "ig", href: "https://www.instagram.com/sourabh_luthra?utm_source=qr&igsh=MWVqY3dhamk2bmZyYw%3D%3D" },
                { label: "YouTube", icon: "▶", href: "https://youtube.com/@sourabhluthra?si=2h01JraNe_nt_n-T" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center
                             justify-center text-gray-400 text-xs font-semibold
                             hover:border-yellow-500 hover:text-yellow-500 transition"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Popular Locations */}
          <div>
            <h3 className="font-semibold mb-4 text-xs tracking-widest text-gray-500 uppercase">
              Popular Locations
            </h3>
            <ul className="space-y-2.5 text-gray-400">
              {["Kolkata", "Mumbai", "Chennai", "Pune"].map((city) => (
                <li key={city}>
                  <a href="#" className="hover:text-yellow-500 transition">
                    {city}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trending Locations */}
          <div>
            <h3 className="font-semibold mb-4 text-xs tracking-widest text-gray-500 uppercase">
              Trending Locations
            </h3>
            <ul className="space-y-2.5 text-gray-400">
              {["Bhubaneshwar", "Hyderabad", "Chandigarh", "Nashik"].map((city) => (
                <li key={city}>
                  <a href="#" className="hover:text-yellow-500 transition">
                    {city}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4 text-xs tracking-widest text-gray-500 uppercase">
              About Us
            </h3>
            <ul className="space-y-2.5 text-gray-400">
              <li><a href="#" className="hover:text-yellow-500 transition">About BandookWale</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition">Tech@BandookWale</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition">Careers</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-xs tracking-widest text-gray-500 uppercase">
              Resources
            </h3>
            <ul className="space-y-2.5 text-gray-400">
              <li><a href="#" className="hover:text-yellow-500 transition">Blog</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition">Help</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition">Sitemap</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition">Legal &amp; Privacy</a></li>
              <li><a href="#" className="hover:text-yellow-500 transition">Vulnerability Disclosure</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black/40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row
                        justify-between items-center gap-3 text-xs text-gray-500">
          <p>
            <span className="text-gray-300 font-medium">
              Luthra Gun House Private Limited
            </span>
            {" "}— All rights reserved © 2000–2030 BandookWale
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-yellow-500 transition">Help</a>
            <span className="text-gray-700">|</span>
            <a href="#" className="hover:text-yellow-500 transition">Sitemap</a>
          </div>
        </div>
      </div>

    </footer>
  );
}