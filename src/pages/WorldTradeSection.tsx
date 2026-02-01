import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

import bmw from "../components/images/BMW.png";
import boeing from "../components/images/logos/boeing.svg";
import foxconn from "../components/images/foxconn.png";
import mitsubishi from "../components/images/mistub.png";
import abbott from "../components/images/Abbott.png";
import huawei from "../components/images/hawei.png";
import qualcomm from "../components/images/logos/qualcomm.svg";
import honda from "../components/images/logos/honda.svg";

const features = [
  "Reliable payouts paid every 28th of the month.",
  "Earn 30–35% annual rental income.",
  "Secure your investment with our 3-year buy-back option.",
  "Easily buy, sell, or lease in a massive global market.",
  "Partner with global giants like Samsung, Nike, and Boeing.",
  "Start investing for just $3,800.",
];

const logos = [
  bmw,
  boeing,
  foxconn,
  mitsubishi,
  abbott,
  huawei,
  qualcomm,
  honda,
];

export default function WorldTradeSection() {
  return (
    <section className="w-full bg-white py-28 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <h2 className="text-center text-3xl md:text-4xl font-semibold text-[#0b1d3a] leading-snug mb-20">
          Access to the world’s biggest business – world trade.
          <br />
          Invest with a company trusted by 500+ leading
          <br />
          multinational companies
        </h2>

        <div className="bg-[#eaf4ef] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="rounded-xl p-10 md:p-14">
            <ul className="space-y-6">
              {features.map((item, index) => (
                <li key={index} className="flex items-start gap-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mt-1" />
                  <p className="text-lg text-[#0b1d3a] leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT SIDE – VERTICAL MARQUEE */}
          <div className="relative h-[340px] overflow-hidden">
            <div className="grid grid-cols-2 gap-6 w-[520px] animate-vertical-marquee">
              {[...logos, ...logos].map((logo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center bg-white border border-gray-100 rounded-lg h-[100px]"
                >
                  <img
                    src={logo}
                    alt="Brand logo"
                    className="h-10 w-auto object-contain opacity-80"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* END */}
        </div>
      </div>
    </section>
  );
}
