interface PaymentDetails {
  userFkId: string;
  paymentMethod: string;
  transactionId: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string;
  createdAt: string;
  imageId?: string;
}

const PaymentSuccessCard = ({ data }: { data: PaymentDetails }) => {
  const isSuccess = data.status === "SUCCESS";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-6">

        {/* Status */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`w-16 h-16 flex items-center justify-center rounded-full text-white text-2xl ${
              isSuccess ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isSuccess ? "✓" : "✕"}
          </div>

          <h2 className="text-xl font-semibold mt-3">
            Payment {data.status}
          </h2>
        </div>

        {/* Payment Details */}
        <div className="space-y-3 text-sm">

          <Row label="Transaction ID" value={data.transactionId} />
          <Row label="Payment Method" value={data.paymentMethod} />
          <Row label="Amount" value={`${data.currency} ${data.amount}`} />
          <Row label="Paid At" value={data.paidAt} />
          <Row label="Created At" value={data.createdAt} />

        </div>

        {/* Receipt Image */}
        {data.imageId && (
          <div className="mt-5">
            <p className="text-sm font-medium mb-2">Receipt</p>
            <img
              src={`/api/images/${data.imageId}`}
              alt="Receipt"
              className="rounded-lg border"
            />
          </div>
        )}

        {/* Button */}
        <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
          Go To Dashboard
        </button>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b pb-1">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default PaymentSuccessCard;
