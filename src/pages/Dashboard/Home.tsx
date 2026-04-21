import React, { useEffect, useState } from "react";
import containerImg from "../../components/images/Container.jpg"
import InvestmentSteps from "../InvestmentSteps";
import TestimonialSection from "../TestimonialSection";
import WorldTradeSection from "../WorldTradeSection";
import EarningsSection from "../EarningsSection";
import BuyToLetDelivers from "../BuyToLetDelivers";
import WhyInvestInContainers from "../WhyInvestInContainers";
import Header from "../Header";
import Footer from "../../components/footer/Footer";
import CategoryFilterBar from "../CategoryFilterBar";
import CategoryGrid from "../CategoryGrid";
import HeroBanner from "../HeroBanner";
import ProductCard from "../ProductCard";
import g1 from "../../components/images/g1.jpg";
import g2 from "../../components/images/g2.jpg";
import SCRAL from "../../components/images/FN SCRAL.jpg"
import HeroImg from "../../components/images/HeroImg.jpg"
import Mossberry from "../../components/images/Mossbery 590.jpg"
import Gork from "../../components/images/Glock 19.jpg"
import Desert from "../../components/images/Desert_Eagle.jpg"
import Sig_saul from "../../components/images/Sig_Saul.jpg"
import shortgun from "../../components/images/42345.jpg"
import close_up from "../../components/images/close_up_rifle.jpg"
import wooden_wall from "../../components/images/wooden_wall.jpg"
import thomas from "../../components/images/thomas-tucker.jpg"
import stngl from "../../components/images/stngr-llc.jpg"
import stngl2 from "../../components/images/stngr-llc2.jpg"
export default function Home() {
  const products = [
    {
      image: g1,
      price: "45,000",
      title: "iMac 27 inch Retina Display",
      location: "Ahmedabad",
      date: "Apr 04",
      featured: true,
    },
    {
      image: g2,
      price: "6,000",
      title: "Blackmagic UltraStudio",
      location: "Bangalore",
      date: "3 days ago",
      featured: true,
    },
    {
      image: stngl2,
      price: "6,500",
      title: "Vivo v60 12GB RAM",
      location: "Maharashtra",
      date: "Today",
    },
    {
      image: HeroImg,
      price: "13,500",
      title: "iPhone 15 Pro Max",
      location: "Maharashtra",
      date: "Today",
    },
    {
      image: close_up,
      price: "13,500",
      title: "iPhone 15 Pro Max",
      location: "Maharashtra",
      date: "Today",
    },
    {
      image: Gork,
      price: "13,500",
      title: "iPhone 15 Pro Max",
      location: "Maharashtra",
      date: "Today",
    },
    {
      image: stngl,
      price: "13,500",
      title: "iPhone 15 Pro Max",
      location: "Maharashtra",
      date: "Today",
    },
    {
      image: thomas,
      price: "13,500",
      title: "iPhone 15 Pro Max",
      location: "Maharashtra",
      date: "Today",
    },
  ];

  return (
    <>
      {/* <PageMeta
        title="StyloCoin Dashboard"
        description="Affiliate and Mining Dashboard"
      /> */}

      {/* Main Layout Container */}
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">

        {/* Header Section */}
        {/* <img
          src={containerImg}
    
          className="w-[108%] max-w-none h-[85vh] object-cover rounded-b-2xl shadow-2xl"
        /> */}
        <CategoryFilterBar />

        <main >
          <div >
            <HeroBanner />
            <CategoryGrid />
            {/* <EarningsSection /> */}
            {/* <WorldTradeSection />
            <WhyInvestInContainers />
            <InvestmentSteps />
            <TestimonialSection />
            <BuyToLetDelivers /> */}
            {/* <Header /> */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 my-8 mx-8 gap-4">
              {products.map((item, index) => (
                <ProductCard key={index} item={item} />
              ))}
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </>
  );
}