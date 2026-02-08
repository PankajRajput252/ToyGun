interface SellRequestDetails {
    requestedAt: string;
    approvedAt?: string;
    sellingChargePercentage: number;
    marketMarginPercentage: number;
    final_amount: number;
    status: string;
}

const SellRequestResultCard = ({ data }: { data: SellRequestDetails }) => {
    const getStatusColor = () => {
        switch (data.status) {
            case "APPROVED":
                return "bg-green-500";
            case "REJECTED":
                return "bg-red-500";
            default:
                return "bg-yellow-500";
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-6">

                {/* Status */}
                <div className="flex flex-col items-center mb-6">
                    <div
                        className={`px-4 py-2 text-white rounded-full text-sm font-semibold ${getStatusColor()}`}
                    >
                        {data.status}
                    </div>

                    <h2 className="text-xl font-semibold mt-3">
                        Sell Request Summary
                    </h2>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">

                    <Row label="Requested At" value={data.requestedAt} />

                    {data.approvedAt && (
                        <Row label="Approved At" value={data.approvedAt} />
                    )}

                    <Row
                        label="Selling Charge"
                        value={`${data.sellingChargePercentage}%`}
                    />

                    <Row
                        label="Market Margin"
                        value={`${data.marketMarginPercentage}%`}
                    />

                    <Row
                        label="Final Amount"
                        value={`₹ ${data.final_amount}`}
                        highlight
                    />

                </div>

                {/* Button */}
                <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
                    Go To Dashboard
                </button>
            </div>
        </div>
    );
};

const Row = ({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string | number;
    highlight?: boolean;
}) => (
    <div className="flex justify-between border-b pb-1">
        <span className="text-gray-500">{label}</span>
        <span className={`font-semibold ${highlight ? "text-blue-600" : ""}`}>
            {value}
        </span>
    </div>
);

export default SellRequestResultCard;
