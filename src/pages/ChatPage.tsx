import { useLocation, useNavigate } from "react-router-dom";
import ChatUI from "./ChatUI";

export default function ChatPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">No chat data found.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-yellow-600 hover:underline text-sm"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const { productId, sellerId, buyerId, productTitle, productImage, sellerName } = state;

  // conversationId format: {productId}-{sellerId}-{buyerId}
  const conversationId = `${productId}-${sellerId}-${buyerId}`;

  return (
    <ChatUI
      conversationId={conversationId}
      userId={buyerId}
      userName={state.buyerName}
      productTitle={productTitle}
      productImage={productImage}
      sellerName={sellerName}
    />
  );
}