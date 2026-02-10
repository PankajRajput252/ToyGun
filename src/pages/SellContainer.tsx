import React, { useEffect, useState } from "react";
import { sellContainer, SellContainerData } from "../services/api";
import Button from "../components/ui/button/Button";
import ComponentCard from "../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow, } from "../components/ui/table";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";


type OwnershipType = "BANK" | "SHARED";
type ContainerType = "20FT" | "40FT";

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userNodeId = user?.nodeId;

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
  investmentFkId: number;
}

export default function SellContainer() {
  const [isAddMode, setIsAddMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSelling, setIsSelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [sellData, setSellData] = useState<SellData>({
    containerType: "",
    ownership: "",
    investedAmount: 0,
    marketValue: 0,
    roiPending: 0,
    holdingDays: 60,
    investmentFkId: 0
  });
  const [containerData, setContainerData] = useState<SellContainerData[]>([]);
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
      investmentFkId: investmentPkId
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


  const handleSellContainer = async () => {
    if (!isSellAllowed) return;

    try {
      setIsSelling(true);
      setError(null);
      const now = new Date();

      const formattedDateTime = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      const payload = {
        investmentFkId: sellData.investmentFkId,
        userFkId: userNodeId,
        requestedAt: formattedDateTime,
        sellAmount: sellData.marketValue,
        sellingChargePercentage: sellingChargePercent,
        final_amount: finalPayout,
        holdingDays: sellData.holdingDays,
        status: 'REQUESTED'
      };



      console.log("SELL PAYLOAD 👉", payload);
      // TODO: POST to backend
      const depositResponse = await sellContainer.add(payload);
      console.log("investment value--->", depositResponse)



      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSelling(false);
    }
  };


  const fetchContainerData = async () => {
    try {
      setIsLoading(true);
      const response = await sellContainer.getAll(1, 25, 'ACTIVE', userNodeId);
      setContainerData(response.content);
    } catch (error) {
      console.error('Error fetching income types:', error);

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContainerData();
  }, []);

  return (
    <>
      <PageMeta title="Sell Container" description="Sell Shipping Containers" />

      <div className="mt-4">
        <PageBreadcrumb pageTitle="Sell Container" />
      </div>

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsAddMode(!isAddMode)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
        >
          {isAddMode ? "View Sell Record" : "Sell Container"}
        </Button>
      </div>

      {isAddMode && (
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
          {/* <button
        disabled={!isSellAllowed}
        className={`w-full py-3 rounded-xl text-white font-semibold ${isSellAllowed
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
          }`}
      >
        {isSellAllowed ? "Sell Container" : "Sell allowed after 45 days"}
      </button> */}
          <button
            onClick={handleSellContainer}
            disabled={!isSellAllowed || isSelling}
            className={`w-full py-3 rounded-xl text-white font-semibold ${!isSellAllowed || isSelling
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isSelling ? "Processing..." : "Sell Container"}
          </button>
          {success && (
            <p className="mt-4 text-green-600 font-medium">
              ✅ Container sold successfully
            </p>
          )}

          {error && (
            <p className="mt-4 text-red-600 font-medium">
              ❌ {error}
            </p>
          )}

        </section>
      )}
      {!isAddMode && (
        <ComponentCard title="Sold Containers">
          <Table>
            <TableHeader>
              <TableRow className="text-white">
                <TableCell>User Id </TableCell>
                <TableCell>Requested Id</TableCell>
                <TableCell>Final Amount</TableCell>
                {/* <TableCell>Selling Charges %</TableCell> */}
                <TableCell>STATUS</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containerData.length === 0 ? (
                <TableRow className="text-white">
                  <TableCell colSpan={5} className="text-center py-6">
                    No Containers Found
                  </TableCell>
                </TableRow>
              ) : (
                containerData.map((c) => (
                  <TableRow  className="text-white">
                    <TableCell>{c.userFkId}</TableCell>
                    <TableCell>{c.requestedAt}</TableCell>
                    <TableCell>{c.final_amount}</TableCell>
                    <TableCell>{c.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ComponentCard>
      )}
    </>
  );

}
