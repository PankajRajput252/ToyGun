import React, { useState } from "react";

type OwnershipType = "single" | "shared";
type ContainerType = "20ft" | "40ft";

interface SellData {
  containerType: ContainerType;
  ownership: OwnershipType;
  investedAmount: number;
  marketValue: number;
  roiPending: number;
  holdingDays: number;
}

export default function SellContainer() {
  const [sellData, setSellData] = useState<SellData>({
    containerType: "20ft",
    ownership: "single",
    investedAmount: 3000,
    marketValue: 3400,
    roiPending: 180,
    holdingDays: 60,
  });

  const [sellingChargePercent, setSellingChargePercent] =
    useState<number>(7);

  /* =============================
     Validations
  ============================== */
  const isSellAllowed = sellData.holdingDays >= 45;

  /* =============================
     Calculations
  ============================== */
  const sellingCharges =
    (sellData.marketValue * sellingChargePercent) / 100;

  const finalPayout =
    sellData.marketValue -
    sellingCharges +
    sellData.roiPending;

  return (
    <section className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        Sell Container
      </h2>

      {/* Container Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">Container Type</label>
          <select
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={sellData.containerType}
            onChange={(e) =>
              setSellData({
                ...sellData,
                containerType: e.target.value as ContainerType,
              })
            }
          >
            <option value="20ft">20 ft Container</option>
            <option value="40ft">40 ft Container</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ownership</label>
          <select
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={sellData.ownership}
            onChange={(e) =>
              setSellData({
                ...sellData,
                ownership: e.target.value as OwnershipType,
              })
            }
          >
            <option value="single">Single</option>
            <option value="shared">Shared</option>
          </select>
        </div>
      </div>

      {/* Financial Inputs */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">
            Current Market Value (USD)
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={sellData.marketValue}
            onChange={(e) =>
              setSellData({
                ...sellData,
                marketValue: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Pending ROI (USD)
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={sellData.roiPending}
            onChange={(e) =>
              setSellData({
                ...sellData,
                roiPending: Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Selling Charges */}
      <div className="mb-6">
        <label className="text-sm font-medium">
          Selling Charges (%)
        </label>
        <select
          value={sellingChargePercent}
          onChange={(e) =>
            setSellingChargePercent(Number(e.target.value))
          }
          className="w-full border rounded-lg px-4 py-2 mt-1"
        >
          <option value={7}>7% (Low Market)</option>
          <option value={8}>8%</option>
          <option value={9}>9%</option>
          <option value={10}>10% (High Market)</option>
        </select>
      </div>

      {/* Holding Period */}
      <div className="mb-6">
        <label className="text-sm font-medium">
          Holding Period (Days)
        </label>
        <input
          type="number"
          value={sellData.holdingDays}
          onChange={(e) =>
            setSellData({
              ...sellData,
              holdingDays: Number(e.target.value),
            })
          }
          className="w-full border rounded-lg px-4 py-2 mt-1"
        />
      </div>

      {/* Results */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <p className="mb-2">
          <strong>Selling Charges:</strong> $
          {sellingCharges.toFixed(2)}
        </p>
        <p className="mb-2">
          <strong>Pending ROI:</strong> $
          {sellData.roiPending}
        </p>
        <p className="text-lg font-semibold text-green-600">
          Final Payout: ${finalPayout.toFixed(2)}
        </p>
      </div>

      {/* Sell Button */}
      <button
        disabled={!isSellAllowed}
        className={`w-full py-3 rounded-xl text-white font-semibold ${
          isSellAllowed
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {isSellAllowed
          ? "Sell Container"
          : "Sell allowed after 45 days"}
      </button>
    </section>
  );
}