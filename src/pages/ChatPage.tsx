import { useLocation } from "react-router-dom";
import ChatUI from "./ChatUI";

export default function ChatPage() {
  const { state } = useLocation();

  if (!state) return <div>No chat data</div>;

  const { productId, sellerId, buyerId, productTitle } = state;

  // 👉 Generate conversationId (temporary)
  const conversationId = `${productId}-${sellerId}-${buyerId}`;

  return (
    <ChatUI
      conversationId={conversationId}
      productTitle={productTitle}
      userId={buyerId}
    />
  );
}