import React, { useEffect, useState } from "react";
import containerImg from "../../components/images/Container.jpg"
import InvestmentSteps from "../InvestmentSteps";
import TestimonialSection from "../TestimonialSection";
import WorldTradeSection from "../WorldTradeSection";
import EarningsSection from "../EarningsSection";
import BuyToLetDelivers from "../BuyToLetDelivers";
import WhyInvestInContainers from "../WhyInvestInContainers";
import ContactCTASection from "../ContactCTASection";
import Footer from "../../components/footer/Footer";



export default function Home() {
  

  return (
    <>
      {/* <PageMeta
        title="StyloCoin Dashboard"
        description="Affiliate and Mining Dashboard"
      /> */}

      {/* Main Layout Container */}
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">

        {/* Header Section */}
        <img
          src={containerImg}
    
          className="w-[108%] max-w-none h-[85vh] object-cover rounded-b-2xl shadow-2xl"
        />
      
        <main >
          <div >

            <EarningsSection />
            <WorldTradeSection />
            <WhyInvestInContainers />
            <InvestmentSteps />
            <TestimonialSection />
            <BuyToLetDelivers />
            <ContactCTASection />
             <Footer/>
          </div>
        </main>
      </div>
    </>
  );
}