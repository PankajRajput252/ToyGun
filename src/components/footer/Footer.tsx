export default function Footer() {
  return (
    <footer className="w-full mt-10">
      
      {/* Top Section */}
      <div className="bg-gradient-to-r from-black to-yellow-500 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-sm">

          {/* Popular Locations */}
          <div>
            <h3 className="font-bold mb-3 text-gray-600">POPULAR LOCATIONS</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Kolkata</li>
              <li>Mumbai</li>
              <li>Chennai</li>
              <li>Pune</li>
            </ul>
          </div>

          {/* Trending Locations */}
          <div>
            <h3 className="font-bold mb-3 text-gray-600">TRENDING LOCATIONS</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Bhubaneshwar</li>
              <li>Hyderabad</li>
              <li>Chandigarh</li>
              <li>Nashik</li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-bold mb-3 text-gray-600">ABOUT US</h3>
            <ul className="space-y-1 text-gray-400">
              <li>About BandookWale</li>
              <li>Tech@BandookWale</li>
              <li>Careers</li>
            </ul>
          </div>

          {/* BandookWale */}
          <div>
            <h3 className="font-bold mb-3 text-gray-600">BandookWale</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Blog</li>
              <li>Help</li>
              <li>Sitemap</li>
              <li>Legal & Privacy information</li>
              <li>Vulnerability Disclosure Program</li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="font-bold mb-3 text-gray-600">FOLLOW US</h3>

            {/* Social Icons */}
            <div className="flex gap-3 mb-4 text-gray-400">
              <span>📘</span>
              <span>📸</span>
              <span>▶️</span>
              <span>❌</span>
              <span>💬</span>
              <span>🔗</span>
            </div>

            {/* App Buttons */}
            <div className="space-y-2">
              <img src="/playstore.png" alt="Google Play" className="h-10" />
              <img src="/appstore.png" alt="App Store" className="h-10" />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Blue Section */}
      <div className="bg-gradient-to-r from-black to-yellow-500 py-6">
        <div className="max-w-7xl mx-auto px-6">

          {/* Logos */}
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/30 pb-6">
            <h2 className="text-lg font-semibold">Luthra Gun House Private limited</h2>
            <div className="flex gap-8 flex-wrap text-sm opacity-90">
              <span>BandookWale</span>
              <span>CarWale</span>
              <span>BikeWale</span>
              <span>CarTrade</span>
              <span>Mobility Outlook</span>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm opacity-80">
            <p>Help - Sitemap</p>
            <p>All rights reserved © 2000-2030 BandookWale</p>
          </div>

        </div>
      </div>

    </footer>
  );
}