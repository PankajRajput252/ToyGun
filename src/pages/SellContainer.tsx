import React, { useEffect, useState } from "react";

type OwnershipType = "BANK" | "SHARED";
type ContainerType = "20FT" | "40FT";

interface Investment {
  investmentPkId: number;
  containerType: ContainerType;
  ownershipType: OwnershipType;
  investedAmount: number;
  roiPercentage: number;
  shares: number;
  status: string;
}

interface SellData {
  containerType: ContainerType | "";
  ownership: OwnershipType | "";
  investedAmount: number;
  marketValue: number;
  roiPending: number;
  holdingDays: number;
}

export default function SellContainer() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [sellData, setSellData] = useState<SellData>({
    containerType: "",
    ownership: "",
    investedAmount: 0,
    marketValue: 0,
    roiPending: 0,
    holdingDays: 60,
  });

  const [sellingChargePercent, setSellingChargePercent] = useState<number>(7);

  /* =============================
     Fetch Investments
  ============================== */
  useEffect(() => {
    fetch(
      "http://containershipment-app-env.eba-p7ijagki.ap-south-1.elasticbeanstalk.com/api/container/getInvestment?page=1&size=25&filterBy=ACTIVE&inputPkId=null&inputFkId=CONT66855610",
      {
        headers: {
          Authorization: `Bearer YOUR_TOKEN_HERE`,
          Accept: "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  /* =============================
     On Container Select
  ============================== */
  const handleContainerChange = (investmentPkId: number) => {
    const selected = investments.find(
      (inv) => inv.investmentPkId === investmentPkId
    );

    if (!selected) return;

    const roiPending =
      (selected.investedAmount * selected.roiPercentage) / 100;

    setSellData({
      containerType: selected.containerType,
      ownership: selected.ownershipType,
      investedAmount: selected.investedAmount,
      marketValue: selected.investedAmount, // ✅ auto populate
      roiPending,
      holdingDays: sellData.holdingDays,
    });
  };

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
    sellData.marketValue - sellingCharges + sellData.roiPending;

  return (
    <section className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Sell Container</h2>

      {/* Container Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">Container</label>
          <select
            className="w-full border rounded-lg px-4 py-2 mt-1"
            onChange={(e) => handleContainerChange(Number(e.target.value))}
          >
            <option value="">Select Container</option>
            {investments.map((inv) => (
              <option key={inv.investmentPkId} value={inv.investmentPkId}>
                {inv.containerType} - {inv.ownershipType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ownership</label>
          <input
            className="w-full border rounded-lg px-4 py-2 mt-1 bg-gray-100"
            value={sellData.ownership}
            disabled
          />
        </div>
      </div>

      {/* Financial Inputs */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">
            Current Market Value (INR)
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={sellData.marketValue}
            readOnly
          />
        </div>

        <div>
          <label className="text-sm font-medium">Pending ROI (INR)</label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={sellData.roiPending}
            readOnly
          />
        </div>
      </div>

      {/* Selling Charges */}
      <div className="mb-6">
        <label className="text-sm font-medium">Selling Charges (%)</label>
        <select
          value={sellingChargePercent}
          onChange={(e) => setSellingChargePercent(Number(e.target.value))}
          className="w-full border rounded-lg px-4 py-2 mt-1"
        >
          <option value={7}>7%</option>
          <option value={8}>8%</option>
          <option value={9}>9%</option>
          <option value={10}>10%</option>
        </select>
      </div>

      {/* Results */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <p>
          <strong>Selling Charges:</strong> ₹{sellingCharges.toFixed(2)}
        </p>
        <p>
          <strong>Pending ROI:</strong> ₹{sellData.roiPending}
        </p>
        <p className="text-lg font-semibold text-green-600">
          Final Payout: ₹{finalPayout.toFixed(2)}
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
        {isSellAllowed ? "Sell Container" : "Sell allowed after 45 days"}
      </button>
    </section>
  );
}
