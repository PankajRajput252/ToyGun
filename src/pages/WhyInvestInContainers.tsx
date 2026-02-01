import React from "react";

export default function WhyInvestInContainers() {
  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <h2 className="text-4xl font-bold text-center text-slate-800 mb-12">
          Why Invest in containers?
        </h2>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Images */}
          <div className="space-y-8">
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src="/container.jpg"
                alt="Shipping Container"
                className="w-full h-80 object-cover"
              />
              <div className="absolute bottom-0 w-full bg-black/60 text-white text-center py-3 text-lg font-semibold">
                A house costs <span className="text-blue-400">138 times</span> more than a shipping container
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src="/house.jpg"
                alt="House"
                className="w-full h-72 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-xl p-6 text-center">
                  <p className="text-sm text-slate-500">ROI</p>
                  <p className="text-2xl font-bold text-green-600">circa 24%</p>
                  <div className="mt-4 h-20 w-40 bg-green-100 rounded-md flex items-end">
                    <div className="w-full h-12 bg-green-500 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="space-y-8">
            {[
              {
                title: "Guaranteed Monthly Income",
                desc: "Enjoy great cash flow with monthly rental income deposited directly to your account.",
              },
              {
                title: "High Returns",
                desc: "Maximize your investment with exceptional returns from leasing containers to the world’s biggest businesses.",
              },
              {
                title: "100% Capital Preservation",
                desc: "Your money is protected by the container itself and an option to sell it back after 3 years.",
              },
              {
                title: "Liquid Market",
                desc: "Containers move 90% of world trade. Easy to sell or reinvest anytime.",
              },
              {
                title: "Trusted Tenants",
                desc: "The world’s most well-known companies rely on containers daily.",
              },
              {
                title: "Affordable Entry Point",
                desc: "Affordable access lets anyone own a piece of the global trade market.",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <div className="w-5 h-5 bg-blue-700 rounded" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Highlight */}
        <div className="mt-16 bg-blue-600 text-white text-center rounded-2xl p-10 text-2xl font-semibold">
          Containers are the ONLY way to move goods across the globe. They’re always in use, ensuring constant demand.
          With a massive, liquid market, your investment stays secure and flexible.
        </div>
      </div>
    </section>
  );
}
