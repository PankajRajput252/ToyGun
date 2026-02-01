import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import AccountDetailsCard from "../../components/dashboard/AccountDetailsCard";
import BusinessDetailsCard from "../../components/dashboard/BusinessDetailsCard";
import { incomeStreamsApi, IncomeStreams, businessApi, businessApiType } from "../../services/api";
import containerImg from "../../components/images/Container.jpg"
import InvestmentSteps from "../InvestmentSteps";
import TestimonialSection from "../TestimonialSection";
import WorldTradeSection from "../WorldTradeSection";
import EarningsSection from "../EarningsSection";
import BuyToLetDelivers from "../BuyToLetDelivers";
import WhyInvestInContainers from "../WhyInvestInContainers";
import ContactCTASection from "../ContactCTASection";

interface WalletData {
  mineWallet: number;
  nodeWallet: number;
  capitalWallet: number;
  totalCredit: number;
  totalDebit: number;
}

export default function Home() {
  const [wallet, setWallet] = useState<WalletData>({
    mineWallet: 0,
    nodeWallet: 0,
    capitalWallet: 0,
    totalCredit: 0,
    totalDebit: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [incomeData, setIncomeData] = useState<IncomeStreams[]>([]);
  const [businessData, setbusinessData] = useState<businessApiType[]>([]);
  console.log("Income Data: jjh", wallet);
  console.log("Income Data: businessData", businessData);
  //hello world
  useEffect(() => {
    const fetchData = async () => {
      const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
      const nodeId = user?.nodeId;

      if (!nodeId) {
        console.warn("No nodeId found in localStorage");
        setLoading(false);
        return;
      }

      try {
        // 🔥 WAIT for API response
        const response = await incomeStreamsApi.getAll(0, 25, 'ACTIVE', nodeId);
        const response2 = await businessApi.getAll(0, 25, 'ACTIVE', nodeId);

        console.log("Income Streams Real Response:", response);
        console.log("Income Streams Real Response:2", response2);

        if (response.content && response.content.length > 0) {
          setIncomeData(response.content);
          setbusinessData(response2.content);
        } else {
          console.warn("Income streams empty");
        }

        fetchWalletData(nodeId);
      } catch (err) {
        console.error("Income API error:", err);
      }
    };

    fetchData();
  }, []);

  const cardProfile = (incomeData?.[0]?.serviceGenerationAmount ?? 0)
    + (incomeData?.[0]?.clubIncomeAmount ?? 0)
    + (incomeData?.[0]?.rewardIncomeAmount ?? 0)
    + (incomeData?.[0]?.fastTrackBonusAmount ?? 0)
    + (incomeData?.[0]?.miningProfitSharingAmount ?? 0)
    + (incomeData?.[0]?.miningGenerationIncomeAmount ?? 0)
    + (incomeData?.[0]?.nodeBusinessSharingAmount ?? 0)
    + (incomeData?.[0]?.matchingIncomeAmount ?? 0);
  const bigCardProfile = wallet.mineWallet + wallet.nodeWallet + wallet.capitalWallet;
  const totalProfile = cardProfile + bigCardProfile;
  const fetchWalletData = async (nodeId: string) => {
    try {
      const url = `http://MineCryptos-env.eba-nsbmtw9i.ap-south-1.elasticbeanstalk.com/api/individual/getWalletData?page=0&size=25&filterBy=ACTIVE&inputPkId=null&inputFkId=${nodeId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "SUCCESS" && data.data?.length > 0) {
        const walletInfo = data.data[0];
        setWallet({
          mineWallet: walletInfo.mineWallet ?? 0,
          nodeWallet: walletInfo.nodeWallet ?? 0,
          capitalWallet: walletInfo.capitalWallet ?? 0,
          totalCredit: walletInfo.totalCredit ?? 0,
          totalDebit: walletInfo.totalDebit ?? 0,
        });
      } else {
        console.warn("No wallet data found for node:", nodeId);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

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
          // alt="Container"
          className="w-[108%] max-w-none h-[85vh] object-cover rounded-b-2xl shadow-2xl"
        />
        {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-b-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to StyloCoin</h1>
              <p className="text-blue-100 dark:text-blue-200">Your Crypto Investment Dashboard</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200 dark:text-blue-300">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${totalProfile.toFixed(2)}
              </p>
            </div>
          </div>
        </div> */}
        {/* <EarningsSection/>
        <WorldTradeSection/>
        <InvestmentSteps />
        <TestimonialSection/> */}

        {/* Scrollable Main Content */}
        <main >
          <div >

            <EarningsSection />
            <WorldTradeSection />
            <WhyInvestInContainers />
            <InvestmentSteps />
            <TestimonialSection />
            <BuyToLetDelivers />
            <ContactCTASection />
            {/* Wallet Section Header */}
            {/* <div className="col-span-12 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                </svg>
                Wallets
              </h2>
            </div> */}

            {/* Wallet Cards */}
            {/* <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard
                title="Mine Wallet"
                amount={loading ? "Loading..." : wallet.mineWallet.toFixed(2)}
                colorClass="bg-gradient-to-br from-orange-500 to-red-600"
                isWallet={true}
                walletIcon="mine"
              />
            </div> */}

            {/* <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard
                title="Node Wallet"
                amount={loading ? "Loading..." : wallet.nodeWallet.toFixed(2)}
                colorClass="bg-gradient-to-br from-blue-500 to-indigo-600"
                isWallet={true}
                walletIcon="node"
              />
            </div>

            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard
                title="Capital Wallet"
                amount={loading ? "Loading..." : wallet.capitalWallet.toFixed(2)}
                colorClass="bg-gradient-to-br from-green-500 to-emerald-600"
                isWallet={true}
                walletIcon="capital"
              />
            </div>

            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard
                title="Total Credit / Debit"
                amount={
                  loading
                    ? "Loading..."
                    : (wallet.capitalWallet + wallet.nodeWallet).toFixed(2)
                }
                colorClass="bg-gradient-to-br from-purple-500 to-pink-600"
                isWallet={true}
                walletIcon="credit"
              />
            </div> */}
            {/* Income Section */}
            {/* <div className="col-span-12 mb-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Income Streams
              </h2>
            </div> */}

            {/* Income Metrics Grid */}
            {/* <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard
                title="Service Generation Income"
                amount={(incomeData?.[0]?.serviceGenerationAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/serviceGeneration"
              />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Matching Income" amount={(incomeData?.[0]?.matchingIncomeAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/matchingIncome"
              />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Club Income" amount={(incomeData?.[0]?.clubIncomeAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/clubIncome"
              />

            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Reward Income" amount={(incomeData?.[0]?.rewardIncomeAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/rewardIncome"
              />
            </div> */}

            {/* Additional Income Metrics */}
            {/* <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Fast Track Bonus" amount={(incomeData?.[0]?.fastTrackBonusAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/fastTrackBonus"
              />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Mining Profit Sharing" amount={(incomeData?.[0]?.miningProfitSharingAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/miningProfitSharing"
              />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Mining Generation Income" amount={(incomeData?.[0]?.miningGenerationIncomeAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/miningGeneration"
              />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <DashboardMetricCard title="Node Business Sharing" amount={(incomeData?.[0]?.nodeBusinessSharingAmount ?? 0).toString()}
                viewAllLink="/StyloCoin/nodeBusinessSharing"
              />
            </div> */}

            {/* Account & Business Details */}
            {/* <div className="col-span-12 mb-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Account & Business Details
              </h2>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <AccountDetailsCard />
            </div> */}

            {/* <div className="col-span-12 lg:col-span-7">
              <BusinessDetailsCard businessData={businessData}/>
            </div> */}
          </div>
        </main>
      </div>
    </>
  );
}