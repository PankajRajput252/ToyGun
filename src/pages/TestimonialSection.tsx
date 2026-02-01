import React, { useState } from "react";
import client1 from "../components/images/client-1.jpg"
import client2 from "../components/images/client-2.jpg"
import client3 from "../components/images/client-1 (1).jpg"
import client4 from "../components/images/client-4.jpg"
import client5 from "../components/images/client-5.jpg"
interface Testimonial {
  id: number;
  name: string;
  role: string;
  country: string;
  image: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Linda W",
    role: "CEO",
    country: "United Kingdom",
    image: client3,
    quote:
      "I invested through Buy-To-Let for years, made great returns, and then sold my containers back to the company as per my contract and used the funds to buy a house.",
  },
  {
    id: 2,
    name: "James K",
    role: "Investor",
    country: "UAE",
    image: client2,
    quote: "“I’m getting pretty good income from my container investments, which makes a real difference every month.”",
  },
  {
    id: 3,
    name: "Sarah M",
    role: "Entrepreneur",
    country: "Singapore",
    image: client1,
    quote: "“I was only invested in the stock market before finding Buy-To-Let. I’ve been dependent on the performance of my stocks which is stressful and a full-time worry. I’ve migrated 60% of my portfolio into containers with Buy-To-Let, which has given me access to an excellent second income that I receive on the 28th of every month without worry.”",
  },
  {
    id: 4,
    name: "Michael T",
    role: "Consultant",
    country: "Germany",
    image: client4,
    quote: "“Owning and leasing containers is reliable. I get paid on time every month. It makes me over 30% a year on average and my containers are insured which means my investment capital is therefore insured against loss. It’s very reassuring.”",
  },
  {
    id: 5,
    name: "Michael T",
    role: "Consultant",
    country: "Germany",
    image: client5,
    quote: "“My daughter introduced me to Buy-To-Let. I get paid by bank transfer every month, and I’m making a lot more from renting my containers than from my property investments. Just what I want at my age. Very satisfied.”",
  },
];

export default function TestimonialSection() {
  const [active, setActive] = useState(testimonials[0]);

  return (
    <section className="w-screen bg-gray-50 py-24 -mx-[calc((100vw-100%)/2)]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <h2 className="text-center text-3xl md:text-4xl font-semibold text-[#0b1d3a] mb-20">
          What our clients say about us
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left Quote */}
          <div className="relative">
            <span className="absolute -top-12 -left-6 text-[120px] text-blue-100 leading-none select-none">
              “
            </span>

            <p className="text-lg md:text-xl text-[#0b1d3a] leading-relaxed mb-10 relative z-10">
              {active.quote}
            </p>

            <div className="flex items-center gap-3">
              <div className="h-[2px] w-14 bg-blue-600" />
              <div>
                <p className="font-semibold text-[#0b1d3a]">
                  {active.name}
                </p>
                <p className="text-sm text-gray-500">
                  {active.role}, {active.country}
                </p>
              </div>
            </div>
          </div>

          {/* Right Avatars */}
          <div className="flex items-center justify-center lg:justify-start gap-6">
            {testimonials.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item)}
                className={`rounded-full p-1 transition-all ${
                  active.id === item.id
                    ? "ring-2 ring-blue-600"
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
