import { useLocation, useSearchParams } from "react-router-dom";
import ChatUI from "./ChatUI";
import { useAuth } from "../context/AuthContext";

export default function ChatPage() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const openConvId = params.get("c") || undefined;

  // Opened from a product page ("Chat with seller" / "Make an offer")
  if (state?.productId && state?.buyerId) {
    const { productId, sellerId, buyerId, productTitle, productImage, sellerName } = state;

    // conversationId format: {productId}-{sellerId}-{buyerId}
    const conversationId = `${productId}-${sellerId}-${buyerId}`;

    return (
      <ChatUI
        key={conversationId}
        conversationId={conversationId}
        userId={buyerId}
        userName={state.buyerName}
        productTitle={productTitle}
        productImage={productImage}
        sellerName={sellerName}
        initialMessage={state.initialMessage}
      />
    );
  }

  // Inbox: opened from the header chat icon or a new-message notification (?c=conversationId)
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem("stylocoin_user") || "{}");
    } catch {
      return {};
    }
  })();
  const userId: string | undefined = user?.nodeId ?? stored?.nodeId;
  const userName: string = user?.name || stored?.name || "Me";

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <p className="text-gray-500">Sign in to see your chats.</p>
      </div>
    );
  }

  return <ChatUI key="inbox" conversationId="" preferredConvId={openConvId} userId={userId} userName={userName} />;
}
