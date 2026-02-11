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
  const [withdrawAmounts, setWithdrawAmounts] = useState<{
    [key: number]: number;
  }>({});

  /* ============================
     Fetch ROI
  ============================ */
  const fetchRoi = async () => {
    try {
      const res = await fetch(
        `http://containershipment-app-env.eba-p7ijagki.ap-south-1.elasticbeanstalk.com/api/container/getRoiTransaction?page=1&size=25&filterBy=ACTIVE&inputPkId=null&inputFkId=${userFkId}`
      );
      const data = await res.json();
      setRoiList(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoi();
  }, []);

  /* ============================
     Check 1 Month Eligibility
  ============================ */
  const isEligible = (creditedAt: string) => {
    const creditedDate = new Date(creditedAt);
    const today = new Date();

    const diffInMs = today.getTime() - creditedDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays >= 30; // allow after 30 days
  };

  /* ============================
     Handle Withdraw
  ============================ */
  const handleWithdraw = async (roi: RoiTransaction) => {
    const enteredAmount =
      withdrawAmounts[roi.roiTxnPkId] || 0;

    if (enteredAmount <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (enteredAmount > roi.monthlyPayout) {
      alert("Amount cannot exceed monthly interest");
      return;
    }

    if (!isEligible(roi.creditedAt)) {
      alert("You can withdraw after 1 month only");
      return;
    }

    try {
      setLoadingId(roi.roiTxnPkId);

      await fetch("http://YOUR_API/api/roi/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roiTxnPkId: roi.roiTxnPkId,
          userFkId,
          withdrawAmount: enteredAmount,
        }),
      });

      await fetchRoi();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="max-w-6xl mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-6">
        Sell Monthly Interest
      </h2>

      {roiList.length === 0 && (
        <p className="text-gray-500">
          No interest available
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
        {roiList.map((roi) => {
          const eligible = isEligible(roi.creditedAt);

          return (
            <div
              key={roi.roiTxnPkId}
            //   className="bg-white rounded-2xl shadow-md p-6 border"
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 min-h-[340px] transition hover:shadow-2xl"

            >
              <div className="mb-3">
                <p className="text-sm text-gray-500">
                  Month
                </p>
                <p className="font-semibold">
                  {roi.contractMonth}
                </p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-500">
                  Available Interest
                </p>
                <p className="text-xl font-bold text-green-600">
                  {roi.currency}{" "}
                  {roi.monthlyPayout.toFixed(2)}
                </p>
              </div>

              {/* Withdraw Input */}
              <div className="mb-3">
                <label className="text-sm text-gray-500">
                  Enter Amount
                </label>
                <input
                  type="number"
                  min={0}
                  max={roi.monthlyPayout}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  placeholder="Enter amount"
                  value={
                    withdrawAmounts[roi.roiTxnPkId] || ""
                  }
                  onChange={(e) =>
                    setWithdrawAmounts({
                      ...withdrawAmounts,
                      [roi.roiTxnPkId]: Number(
                        e.target.value
                      ),
                    })
                  }
                />
              </div>

              {!eligible && (
                <p className="text-xs text-red-500 mb-2">
                  Withdraw allowed after 1 month
                </p>
              )}

              <button
                disabled={
                  loadingId === roi.roiTxnPkId ||
                  !eligible
                }
                onClick={() =>
                  handleWithdraw(roi)
                }
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50"
              >
                {loadingId === roi.roiTxnPkId
                  ? "Processing..."
                  : "Withdraw"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
