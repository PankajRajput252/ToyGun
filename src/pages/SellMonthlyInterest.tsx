import { useEffect, useState } from "react";
import {  sellMonthlyInterest } from "../services/api";

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

interface WithdrawRequest {
  withdrawRequestPkId:number;
  userFkId: string;
  investmentFkId: number;
  requestAmount: number;
  currency: string;
  withdrawalMethod: string;
  status: "AVAILABLE" | "WITHDRAWN" | "PENDING";
  requestedAt: string;
  approvedAt: string;
  paidAt: string;
  adminRemark: string;
}

const user = JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
const userFkId = user?.nodeId;

export default function SellMonthlyInterest() {
  const [roiList, setRoiList] = useState<RoiTransaction[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawRequest, setWithdrawRequest] = useState<WithdrawRequest[]>([]);
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
  // const handleWithdraw = async (roi: RoiTransaction) => {
  //   const enteredAmount =
  //     withdrawAmounts[roi.roiTxnPkId] || 0;

  //   if (enteredAmount <= 0) {
  //     alert("Enter valid amount");
  //     return;
  //   }

  //   if (enteredAmount > roi.monthlyPayout) {
  //     alert("Amount cannot exceed monthly interest");
  //     return;
  //   }

  //   if (!isEligible(roi.creditedAt)) {
  //     alert("You can withdraw after 1 month only");
  //     return;
  //   }

  //   try {
  //     setLoadingId(roi.roiTxnPkId);

  //     await fetch("http://containershipment-app-env.eba-p7ijagki.ap-south-1.elasticbeanstalk.com/api/container/addWithdrawRequest", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         roiTxnPkId: roi.roiTxnPkId,
  //         userFkId,
  //         withdrawAmount: enteredAmount,
  //       }),
  //     });

  //     await fetchRoi();
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoadingId(null);
  //   }
  // };
const handleWithdraw = async () => {
  if (withdrawAmount <= 0) {
    alert("Enter valid amount");
    return;
  }

  if (withdrawAmount > totalInterest) {
    alert("Amount cannot exceed total available interest");
    return;
  }

  if (!isAnyEligible) {
    alert("Withdrawal allowed only after 1 month");
    return;
  }



  try {
    setLoadingId(1);

    const payload: WithdrawRequest = {
      withdrawRequestPkId:0,
      userFkId,
      investmentFkId: availableRois[0]?.investmentFkId, // or handle properly if multiple
      requestAmount: withdrawAmount,
      currency: availableRois[0]?.currency || "USD",
      withdrawalMethod: "CRYPTO",
      status: "PENDING",
      requestedAt: new Date().toISOString(),
      approvedAt: "",
      paidAt: "",
      adminRemark: "",
    };

    // await fetch("http://containershipment-app-env.eba-p7ijagki.ap-south-1.elasticbeanstalk.com/api/container/addWithdrawRequest", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // });
      const depositResponse = await sellMonthlyInterest.add(payload);

    setWithdrawAmount(0);
    await fetchRoi();
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingId(null);
  }
};




const availableRois = roiList.filter(
  (roi) => roi.status?.toUpperCase() === "ACTIVE"
);

const totalInterest = availableRois.reduce(
  (sum, roi) => sum + Number(roi.monthlyPayout || 0),
  0
);

// Check if ANY ROI is eligible (1 month passed)
const isAnyEligible = availableRois.some((roi) =>
  isEligible(roi.creditedAt)
);
  return (
//     <section className="max-w-6xl mx-auto mt-10">
//       <h2 className="text-2xl font-semibold mb-6">
//         Sell Monthly Interest
//       </h2>

//       {roiList.length === 0 && (
//         <p className="text-gray-500">
//           No interest available
//         </p>
//       )}

//       <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
//   <p className="text-sm text-gray-600">
//     Total Available Interest
//   </p>
//   <p className="text-2xl font-bold text-green-700">
//     {roiList[0]?.currency || "USD"} {totalInterest.toFixed(2)}
//   </p>
// </div>

//       <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
//         {roiList.map((roi) => {
//           const eligible = isEligible(roi.creditedAt);

//           return (
//             <div
//               key={roi.roiTxnPkId}
//               //   className="bg-white rounded-2xl shadow-md p-6 border"
//               className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 min-h-[340px] transition hover:shadow-2xl"

//             >
//               <div className="mb-3">
//                 <p className="text-sm text-gray-500">
//                   Month
//                 </p>
//                 <p className="font-semibold">
//                   {roi.contractMonth}
//                 </p>
//               </div>

//               <div className="mb-3">
//                 <p className="text-sm text-gray-500">
//                   Available Interest
//                 </p>
//                 <p className="text-xl font-bold text-green-600">
//                   {roi.currency}{" "}
//                   {roi.monthlyPayout.toFixed(2)}
//                 </p>
//               </div>

//               {/* Withdraw Input */}
//               <div className="mb-3">
//                 <label className="text-sm text-gray-500">
//                   Enter Amount
//                 </label>
//                 <input
//                   type="number"
//                   min={0}
//                   max={roi.monthlyPayout}
//                   className="w-full border rounded-lg px-3 py-2 mt-1"
//                   placeholder="Enter amount"
//                   value={
//                     withdrawAmounts[roi.roiTxnPkId] || ""
//                   }
//                   onChange={(e) =>
//                     setWithdrawAmounts({
//                       ...withdrawAmounts,
//                       [roi.roiTxnPkId]: Number(
//                         e.target.value
//                       ),
//                     })
//                   }
//                 />
//               </div>

//               {/* Financial Inputs */}
//               <div className="grid md:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <label className="text-sm font-medium">
//                     Enter Address for withdrawal
//                   </label>
//                   <input
//                     type="number"
//                     className="w-full border rounded-lg px-4 py-2 mt-1"
//                     // value={sellData.marketValue}
//                     readOnly
//                   />
//                 </div>

//                 <div>
//                   <label className="text-sm font-medium"> Charged Applied</label>
//                   <input
//                     type="number"
//                     className="w-full border rounded-lg px-4 py-2 mt-1"
//                     // value={sellData.roiPending}
//                     readOnly
//                   />
//                 </div>
//               </div>

//               {!eligible && (
//                 <p className="text-xs text-red-500 mb-2">
//                   Withdraw allowed after 1 month
//                 </p>
//               )}

//               <button
//                 disabled={
//                   loadingId === roi.roiTxnPkId ||
//                   !eligible
//                 }
//                 onClick={() =>
//                   handleWithdraw(roi)
//                 }
//                 className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50"
//               >
//                 {loadingId === roi.roiTxnPkId
//                   ? "Processing..."
//                   : "Withdraw"}
//               </button>
//             </div>
//           );
//         })}
//       </div>
//     </section>
<section className="max-w-3xl mx-auto mt-10">
  <h2 className="text-2xl font-semibold mb-6">
    Withdraw Interest
  </h2>

  <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

    {/* Total Interest */}
    <div className="mb-4">
      <p className="text-sm text-gray-500">
        Total Available Interest
      </p>
      <p className="text-2xl font-bold text-green-600">
        {availableRois[0]?.currency || "USD"}{" "}
        {totalInterest.toFixed(2)}
      </p>
    </div>

    {/* Input */}
    <div className="mb-4">
      <label className="text-sm text-gray-500">
        Enter Amount
      </label>
      <input
        type="number"
        className="w-full border rounded-lg px-3 py-2 mt-1"
        placeholder="Enter amount"
        value={withdrawAmount || ""}
        onChange={(e) =>
          setWithdrawAmount(Number(e.target.value))
        }
      />
    </div>

    {/* Address */}
    <div className="mb-4">
      <label className="text-sm font-medium">
        Enter Address for withdrawal
      </label>
      <input
        type="text"
        className="w-full border rounded-lg px-4 py-2 mt-1"
      />
    </div>

    {/* Charges */}
    <div className="mb-4">
      <label className="text-sm font-medium">
        Charges Applied
      </label>
      <input
        type="text"
        className="w-full border rounded-lg px-4 py-2 mt-1"
        value="0"
        readOnly
      />
    </div>

    {/* Validation Message */}
    {!isAnyEligible && (
      <p className="text-xs text-red-500 mb-2">
        Withdrawal allowed after 1 month
      </p>
    )}

    {/* Button */}
    <button
      disabled={loadingId !== null || !isAnyEligible}
      onClick={handleWithdraw}
      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50"
    >
      {loadingId ? "Processing..." : "Withdraw"}
    </button>
  </div>
</section>
  );
}
