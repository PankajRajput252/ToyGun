import { useEffect, useState } from "react";

/* ============================
   Types aligned with backend
============================ */
type ContainerType = "20FT" | "40FT";
type OwnershipType = "BANK" | "SHARED";

interface Investment {
  investmentPkId: number;
  containerType: ContainerType;
  ownershipType: OwnershipType;
  investedAmount: number;
  roiPercentage: number;
  status: string;
}

interface RentData {
  investmentPkId?: number;
  containerType: ContainerType | "";
  ownershipType: OwnershipType | "";
  investedAmount: number;
  monthlyROI: number;
  contractMonths: number;
  startDate: string;
}

export default function RentContainer() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [rentData, setRentData] = useState<RentData>({
    containerType: "",
    ownershipType: "",
    investedAmount: 0,
    monthlyROI: 0,
    contractMonths: 36, // ✅ minimum 3 years
    startDate: "",
  });

  /* ============================
     Fetch Investments
  ============================ */
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
      .then((res) => setInvestments(res.data || []))
      .catch(console.error);
  }, []);

  /* ============================
     Handle Container Selection
  ============================ */
  const handleInvestmentSelect = (investmentPkId: number) => {
    const selected = investments.find(
      (i) => i.investmentPkId === investmentPkId
    );

    if (!selected) return;

    setRentData((prev) => ({
      ...prev,
      investmentPkId: selected.investmentPkId,
      containerType: selected.containerType,
      ownershipType: selected.ownershipType,
      investedAmount: selected.investedAmount,
      monthlyROI: selected.roiPercentage,
    }));
  };

  /* ============================
     Calculations
  ============================ */
  const monthlyPayout =
    (rentData.investedAmount * rentData.monthlyROI) / 100;

  const totalContractReturn =
    monthlyPayout * rentData.contractMonths;

  /* ============================
     Submit Rent
  ============================ */
  const handleRent = () => {
    if (!rentData.investmentPkId) return;

    const payload = {
      investmentPkId: rentData.investmentPkId,
      contractMonths: rentData.contractMonths,
      startDate: rentData.startDate,
      monthlyROI: rentData.monthlyROI,
      monthlyPayout,
      totalContractReturn,
    };

    console.log("RENT PAYLOAD", payload);
    // TODO: POST to backend
  };
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
    setRentData((prev) => ({
      ...prev,
      startDate: today,
    }));
  }, []);

  return (
    <section className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        Rent Container
      </h2>

      {/* Container Selection */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">Select Container</label>
          <select
            className="w-full border rounded-lg px-4 py-2 mt-1"
            onChange={(e) =>
              handleInvestmentSelect(Number(e.target.value))
            }
          >
            <option value="">Select Container</option>
            {investments.map((inv) => (
              <option
                key={inv.investmentPkId}
                value={inv.investmentPkId}
              >
                {inv.containerType} - {inv.ownershipType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ownership</label>
          <input
            className="w-full border rounded-lg px-4 py-2 mt-1 bg-gray-100"
            value={rentData.ownershipType}
            disabled
          />
        </div>
      </div>

      {/* Investment Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">
            Invested Amount (INR)
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 mt-1 bg-gray-100"
            value={rentData.investedAmount}
            disabled
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Contract Period (Months)
          </label>
          <input
            type="number"
            min={36}
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={rentData.contractMonths}
            onChange={(e) =>
              setRentData({
                ...rentData,
                contractMonths: Math.max(
                  36,
                  Number(e.target.value)
                ),
              })
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 36 months (3 years)
          </p>
        </div>
      </div>

      {/* Start Date */}
      <div className="mb-6">
        <label className="text-sm font-medium">
          Rent Start Date
        </label>
        <input
          type="date"
          className="w-full border rounded-lg px-4 py-2 mt-1"
          value={rentData.startDate}
          onChange={(e) =>
            setRentData({
              ...rentData,
              startDate: e.target.value,
            })
          }
        />

      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <p>
          <strong>Monthly ROI:</strong>{" "}
          {rentData.monthlyROI}%
        </p>
        <p>
          <strong>Monthly Payout:</strong> ₹
          {monthlyPayout.toFixed(2)}
        </p>
        <p className="text-green-600 font-semibold">
          Total Return (Contract): ₹
          {totalContractReturn.toFixed(2)}
        </p>
      </div>

      {/* Action */}
      <button
        onClick={handleRent}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
      >
        Start Renting
      </button>
    </section>
  );
}
