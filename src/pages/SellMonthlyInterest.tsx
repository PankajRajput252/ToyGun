import { useEffect, useState } from "react";

interface RoiTransaction {
  roiTxnPkId: number;
  investmentFkId: number;
  contractMonth: number;
  monthlyPayout: number;
  roiPercentage: number;
  currency: string;
  status: "AVAILABLE" | "WITHDRAWN" | "PENDING";
  creditedAt: string;
}

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userFkId = user?.nodeId;

export default function SellMonthlyInterest() {
  const [roiList, setRoiList] = useState<RoiTransaction[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  /* ============================
     Fetch Available ROI
  ============================ */
  const fetchRoi = async () => {
    try {
      const res = await fetch(
        `http://YOUR_API/api/roi/available?userFkId=${userFkId}`,
        {
          headers: {
            Authorization: `Bearer YOUR_TOKEN`,
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      setRoiList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoi();
  }, []);

  /* ============================
     Withdraw ROI
  ============================ */
  const handleWithdraw = async (roiTxnPkId: number) => {
    try {
      setLoadingId(roiTxnPkId);

      await fetch(
        "http://YOUR_API/api/roi/withdraw",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer YOUR_TOKEN`,
          },
          body: JSON.stringify({
            roiTxnPkId,
            userFkId,
          }),
        }
      );

      await fetchRoi(); // refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  /* ============================
     UI
  ============================ */
  return (
    <section className="max-w-5xl mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-6">
        Sell Monthly Interest
      </h2>

      {roiList.length === 0 && (
        <p className="text-gray-500">
          No interest available for withdrawal
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roiList.map((roi) => (
          <div
            key={roi.roiTxnPkId}
            className="bg-white rounded-2xl shadow-md p-6 border"
          >
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Contract Month
              </p>
              <p className="text-lg font-semibold">
                Month {roi.contractMonth}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Monthly Interest
              </p>
              <p className="text-xl font-bold text-green-600">
                {roi.currency} {roi.monthlyPayout.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                ROI Percentage
              </p>
              <p>{roi.roiPercentage}%</p>
            </div>

            <button
              disabled={loadingId === roi.roiTxnPkId}
              onClick={() =>
                handleWithdraw(roi.roiTxnPkId)
              }
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50"
            >
              {loadingId === roi.roiTxnPkId
                ? "Processing..."
                : "Sell Interest"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
