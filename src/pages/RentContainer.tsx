import { useEffect, useState } from "react";

type ContainerType = "20FT" | "40FT";
type OwnershipType = "SINGLE" | "SHARED";

interface RentData {
  containerType: ContainerType;
  ownershipType: OwnershipType;
  investedAmount: number;
  monthlyROI: number;
  contractMonths: number;
  startDate: string;
}

export default function RentContainer() {
  const [rentData, setRentData] = useState<RentData>({
    containerType: "20FT",
    ownershipType: "SINGLE",
    investedAmount: 3000,
    monthlyROI: 0,
    contractMonths: 15,
    startDate: "",
  });

  /* ============================
     ROI LOGIC (CORE)
  ============================ */
  useEffect(() => {
    let roi = 0;

    if (rentData.containerType === "20FT") {
      roi = rentData.ownershipType === "SINGLE" ? 3.5 : 3;
    }

    if (rentData.containerType === "40FT") {
      roi = rentData.ownershipType === "SINGLE" ? 4.5 : 4;
    }

    setRentData((prev) => ({ ...prev, monthlyROI: roi }));
  }, [rentData.containerType, rentData.ownershipType]);

  /* ============================
     Calculations
  ============================ */
  const monthlyPayout =
    (rentData.investedAmount * rentData.monthlyROI) / 100;

  const totalContractReturn =
    monthlyPayout * rentData.contractMonths;

  /* ============================
     Submit
  ============================ */
  const handleRent = () => {
    const payload = {
      ...rentData,
      monthlyPayout,
      totalContractReturn,
    };

    console.log("RENT PAYLOAD", payload);
    // TODO: POST to backend
  };

  return (
    <section className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow">
      <h2 className="text-2xl font-semibold mb-6">
        Rent Container
      </h2>

      {/* Selection */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">Container Type</label>
          <select
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={rentData.containerType}
            onChange={(e) =>
              setRentData({
                ...rentData,
                containerType: e.target.value as ContainerType,
              })
            }
          >
            <option value="20FT">20 ft Container</option>
            <option value="40FT">40 ft Container</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ownership Type</label>
          <select
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={rentData.ownershipType}
            onChange={(e) =>
              setRentData({
                ...rentData,
                ownershipType: e.target.value as OwnershipType,
              })
            }
          >
            <option value="SINGLE">Single Owner</option>
            <option value="SHARED">Shared Ownership</option>
          </select>
        </div>
      </div>

      {/* Investment */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium">
            Invested Amount (USD)
          </label>
          <input
            type="number"
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={rentData.investedAmount}
            onChange={(e) =>
              setRentData({
                ...rentData,
                investedAmount: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Contract Period (Months)
          </label>
          <input
            type="number"
            min={15}
            className="w-full border rounded-lg px-4 py-2 mt-1"
            value={rentData.contractMonths}
            onChange={(e) =>
              setRentData({
                ...rentData,
                contractMonths: Number(e.target.value),
              })
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 15 months contract
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
          <strong>Monthly ROI:</strong> {rentData.monthlyROI}%
        </p>
        <p>
          <strong>Monthly Payout:</strong> $
          {monthlyPayout.toFixed(2)}
        </p>
        <p className="text-green-600 font-semibold">
          Total Return (Contract): $
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
