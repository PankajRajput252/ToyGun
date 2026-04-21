import { useEffect, useState } from "react";
import { rentContainer, RentContainerData } from "../services/api";
import Button from "../components/ui/button/Button";
import ComponentCard from "../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow, } from "../components/ui/table";

/* ============================
   Types
============================ */
type ContainerType = "20FT" | "40FT";
type OwnershipType = "BANK" | "SHARED";

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userNodeId = user?.nodeId;

interface Investment {
  investmentPkId: number;
  containerType: ContainerType;
  ownershipType: OwnershipType;
  investedAmount: number;
  roiPercentage: number;
  status: string;
  currency: string;
}

interface RentData {
  investmentPkId?: number;
  containerType: ContainerType | "";
  ownershipType: OwnershipType | "";
  investedAmount: number;
  monthlyROI: number;
  contractMonths: number;
  startDate: string; // yyyy-mm-dd
  currency: string;
}

export default function RentContainer() {
  const [containerData, setContainerData] = useState<RentContainerData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [rentData, setRentData] = useState<RentData>({
    containerType: "",
    ownershipType: "",
    investedAmount: 0,
    monthlyROI: 0,
    contractMonths: 36,
    startDate: "",
    currency: "",
  });


  const fetchContainerData = async () => {
    try {
      setIsLoading(true);
      const response = await rentContainer.getAll(1, 25, 'ACTIVE', userNodeId);
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

  /* ============================
     Fetch Investments
  ============================ */
  useEffect(() => {
    fetch(
      "http://bandookwala-env.eba-bih9jrqy.ap-south-1.elasticbeanstalk.com/api/container/getInvestment?page=1&size=25&filterBy=ACTIVE&inputPkId=null&inputFkId=CONT66855610",
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
     Set Today Date (yyyy-mm-dd)
  ============================ */
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setRentData((prev) => ({
      ...prev,
      startDate: today,
    }));
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
      currency: selected.currency,
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
     Helpers
  ============================ */
  const formatDateDDMMYYYY = (date: string) => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    return `${d}-${m}-${y}`;
  };

  /* ============================
     Submit Rent
  ============================ */
  const handleRent = async () => {
    if (!rentData.investmentPkId) return;

    try {



      const payload = {
        investmentFkId: rentData.investmentPkId,
        userFkId: userNodeId,
        contractMonth: rentData.contractMonths,
        rentStartDate: rentData.startDate,
        currency: rentData.currency,
        roiPercentage: rentData.monthlyROI,
        monthlyPayout,
        totalContractReturn,
        creditedAt: rentData.startDate
      };

      console.log("RENT PAYLOAD", payload);
      // TODO: POST API
      const depositResponse = await rentContainer.add(payload);
      console.log("investment value--->", depositResponse)
       await fetchContainerData();
       setIsAddMode(false);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {

    }

  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsAddMode(!isAddMode)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
        >
          {isAddMode ? "View Rented Record" : "Rent Container"}
        </Button>
      </div>
      {isAddMode && (
        <section className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Rent Container</h2>

          {/* Select Container */}
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
                Invested Amount ({rentData.currency})
              </label>
              <input
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
                    contractMonths: Math.max(36, Number(e.target.value)),
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 36 months
              </p>
            </div>
          </div>

          {/* Start Date */}
          <div className="mb-6">
            <label className="text-sm font-medium">Rent Start Date</label>
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
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formatDateDDMMYYYY(rentData.startDate)}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p>
              <strong>Monthly ROI:</strong> {rentData.monthlyROI}%
            </p>
            <p>
              <strong>Monthly Payout:</strong>{" "}
              {rentData.currency} {monthlyPayout.toFixed(2)}
            </p>
            <p className="text-green-600 font-semibold">
              Total Return: {rentData.currency}{" "}
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
      )}
      {!isAddMode && (
        <ComponentCard title="Rent Containers">
          <Table>
            <TableHeader>
              <TableRow className="text-gray-800 dark:text-white">
                <TableCell>User Id </TableCell>
                <TableCell>Rent Start Date</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Monthly Payout</TableCell>
                <TableCell>ROI Percentage</TableCell>
                <TableCell>Contract Months</TableCell>

              </TableRow>
            </TableHeader>
            <TableBody>
              {containerData.length === 0 ? (
                <TableRow className="text-gray-800 dark:text-white">
                  <TableCell colSpan={5} className="text-center py-6">
                    No Containers Found
                  </TableCell>
                </TableRow>
              ) : (
                containerData.map((c) => (
                  <TableRow className="text-gray-800 dark:text-white">
                    <TableCell>{c.userFkId}</TableCell>
                    <TableCell>{c.rentStartDate}</TableCell>
                    <TableCell>{c.currency}</TableCell>
                    <TableCell>{c.monthlyPayout}</TableCell>
                    <TableCell>{c.roiPercentage}</TableCell>
                      <TableCell>{c.contractMonth}</TableCell>
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
