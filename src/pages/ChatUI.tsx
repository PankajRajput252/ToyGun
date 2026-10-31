import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
import { Send, Wifi, WifiOff, MessageSquare, ArrowLeft } from "lucide-react";
import  { WS_URL, API_URL} from "../services/api";


type Message = {
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  type?: "CHAT" | "JOIN" | "LEAVE";
};

type Conversation = {
  conversationId: string;
  productTitle: string;
  productImage: string;
  sellerName: string;
  lastMessage?: string;
  lastTimestamp?: string;
};

type Props = {
  conversationId: string;
  userId: string;
  userName?: string;
  productTitle?: string;
  productImage?: string;
  sellerName?: string;
  initialMessage?: string; // pre-fills the input, e.g. "Make an offer" from the product page
};

// const WS_URL = "https://api.bandookwale.com/ws"; // ← update to your backend URL
// const API_URL = "https://api.bandookwale.com";

// conversationId format: {productId}-{sellerId}-{buyerId}
const parseConvId = (convId: string) => {
  const parts = convId.split("-");
  return { sellerId: parts[parts.length - 2], buyerId: parts[parts.length - 1] };
};

export default function ChatUI({
  conversationId,
  userId,
  userName = "Me",
  productTitle = "Product",
  productImage = "",
  sellerName = "Seller",
  initialMessage = "",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState(conversationId);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // Mobile only: toggles between the conversation list and the chat window
  const [showListMobile, setShowListMobile] = useState(false);
  // Name of the other person in each conversation, learned from their messages
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);
  const activeConvIdRef = useRef(conversationId);

  // The owner opening chat from their own product lands on a {seller}-{seller} thread with nobody in it
  const ownConv = parseConvId(conversationId);
  const isSelfConv = ownConv.sellerId === ownConv.buyerId;

  const rememberPeerName = (convId: string, msgs: Message[]) => {
    const peerMsg = msgs.find((m) => m.senderId !== userId && m.senderName);
    if (peerMsg) setPeerNames((prev) => ({ ...prev, [convId]: peerMsg.senderName! }));
  };

  // Who I'm talking to: the buyer if I own the product, otherwise the seller
  const getPeer = (convId: string, fallbackSellerName?: string) => {
    const role = parseConvId(convId).sellerId === userId ? "Buyer" : "Seller";
    const name = peerNames[convId] || (role === "Seller" ? fallbackSellerName : undefined);
    return { role, name: name || role };
  };

 const loadHistory = async (convId: string) => {
  if (!convId || convId.includes("undefined")) {
    setMessages([]);
    return;
  }
  try {
    setIsLoadingHistory(true);
    const res = await fetch(`${API_URL}/api/chat/history/${convId}`);
    
    // ← Backend not ready yet — treat 404 as empty
    if (!res.ok) {
      setMessages([]);
      return;
    }

    const data = await res.json();
    // ← Guard: API might return object instead of array
    const history: Message[] = Array.isArray(data) ? data : [];
    setMessages(history);
    rememberPeerName(convId, history);

  } catch (err) {
    console.error("Failed to load chat history:", err);
    setMessages([]);
  } finally {
    setIsLoadingHistory(false);
  }
};

const loadConversations = async () => {
  if (!userId || userId === "loggedInUserId") return;
  try {
    const res = await fetch(`${API_URL}/api/chat/conversations/${userId}`);

    // ← Backend not ready yet — treat 404 as empty
    if (!res.ok) {
      setConversations([]);
      return;
    }

    const data = await res.json();
    // ← Guard: API might return object instead of array
    const list: Conversation[] = Array.isArray(data) ? data : [];
    setConversations(list);

    // Owner came from their own product — open their first real conversation instead
    const firstReal = list.find((c) => c.conversationId !== conversationId);
    if (isSelfConv && activeConvIdRef.current === conversationId && firstReal) {
      switchConversation(firstReal.conversationId);
    }

  } catch (err) {
    console.error("Failed to load conversations:", err);
    setConversations([]);
  }
};
  // ─── Subscribe to a conversation topic ───────────────────────────────────
  const subscribeToConversation = (client: Client, convId: string) => {
    // Unsubscribe from previous topic
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const topic = `/topic/chat/${convId}`;
    subscriptionRef.current = client.subscribe(topic, (stompMessage) => {
      const newMessage: Message = JSON.parse(stompMessage.body);
      setMessages((prev) => [...prev, newMessage]);
      rememberPeerName(convId, [newMessage]);
    });
  };

  // ─── Connect WebSocket on mount ───────────────────────────────────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,

      onConnect: () => {
        setIsConnected(true);
        console.log("✅ WebSocket connected");
        subscribeToConversation(client, activeConvIdRef.current);
      },

      onDisconnect: () => {
        setIsConnected(false);
        console.log("❌ WebSocket disconnected");
      },

      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
    setStompClient(client);

    // Load history + conversations on mount
    loadHistory(activeConvId);
    loadConversations();

    return () => {
      client.deactivate();
    };
  }, []);

  // ─── Switch conversation ───────────────────────────────────────────────────
  const switchConversation = (convId: string) => {
    setActiveConvId(convId);
    activeConvIdRef.current = convId;
    loadHistory(convId);
    if (clientRef.current?.connected) {
      subscribeToConversation(clientRef.current, convId);
    }
  };

  // ─── Auto scroll to bottom ────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim()) return;

    const msg: Message = {
      senderId: userId,
      senderName: userName,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      type: "CHAT",
    };

    if (clientRef.current?.connected) {
      // Send via WebSocket to backend
      clientRef.current.publish({
        destination: `/app/chat.send/${activeConvId}`,
        body: JSON.stringify(msg),
      });
    } else {
      // Fallback: show locally if disconnected
      setMessages((prev) => [...prev, msg]);
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const activeConv = conversations.find((c) => c.conversationId === activeConvId);
  const isProductConv = activeConvId === conversationId;
  const headerTitle = isProductConv ? productTitle : activeConv?.productTitle || productTitle;
  const headerImage = isProductConv ? productImage : activeConv?.productImage || productImage;
  const headerPeer = getPeer(activeConvId, isProductConv ? sellerName : activeConv?.sellerName);

  const renderPeer = (peer: { role: string; name: string }) => (
    <p className="flex items-center gap-2 font-semibold text-sm text-gray-800 dark:text-white min-w-0">
      <span className="truncate">{peer.name}</span>
      {peer.name !== peer.role && (
        <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
          {peer.role}
        </span>
      )}
    </p>
  );

  return (
    <div className="flex h-[calc(100dvh-114px)] lg:h-[calc(100dvh-90px)] overflow-hidden bg-gray-100 dark:bg-gray-900">

      {/* SIDEBAR */}
      <div className={`${showListMobile ? "flex" : "hidden"} md:flex w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-col overflow-y-auto`}>

        {/* Sidebar Header */}
        <div className="p-4 font-bold text-lg border-b dark:border-gray-700
                        text-gray-800 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-yellow-500" />
          Chats
        </div>

        {/* Current conversation (from product) */}
        {!isSelfConv && (
        <div
          onClick={() => { switchConversation(conversationId); setShowListMobile(false); }}
          className={`p-4 cursor-pointer border-b dark:border-gray-700 transition
            ${activeConvId === conversationId
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500"
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
        >
          <div className="flex items-center gap-3">
            {productImage ? (
              <img
                src={productImage}
                alt={productTitle}
                className="w-10 h-10 rounded-lg object-cover border flex-shrink-0"
                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/40"; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
            )}
            <div className="min-w-0">
              {renderPeer(getPeer(conversationId, sellerName))}
              <p className="text-xs text-gray-400 truncate">{productTitle}</p>
            </div>
          </div>
        </div>
        )}

        {/* Other conversations */}
        {conversations
          .filter((c) => c.conversationId !== conversationId)
          .map((conv) => (
            <div
              key={conv.conversationId}
              onClick={() => { switchConversation(conv.conversationId); setShowListMobile(false); }}
              className={`p-4 cursor-pointer border-b dark:border-gray-700 transition
                ${activeConvId === conv.conversationId
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
            >
              {renderPeer(getPeer(conv.conversationId, conv.sellerName))}
              <p className="text-xs text-gray-400 truncate">
                {conv.lastMessage || conv.productTitle || conv.conversationId}
              </p>
            </div>
          ))}
      </div>

      {/* CHAT WINDOW */}
      <div className={`${showListMobile ? "hidden" : "flex"} md:flex flex-col flex-1 min-w-0`}>

        {/* Chat Header */}
        <div className="p-3 md:p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700
                        flex items-center gap-2 md:gap-3 shadow-sm">
          {/* Back to chats list — mobile only */}
          <button
            onClick={() => setShowListMobile(true)}
            className="md:hidden text-gray-500 hover:text-black dark:hover:text-white transition flex-shrink-0"
            aria-label="Show chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {headerImage && (
            <img
              src={headerImage}
              alt={headerTitle}
              className="w-9 h-9 rounded-lg object-cover border flex-shrink-0"
              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/36"; }}
            />
          )}
          <div className="flex-1 min-w-0">
            {renderPeer(headerPeer)}
            <p className="text-xs text-gray-400 truncate">Re: {headerTitle}</p>
          </div>

          {/* Connection badge */}
          {isConnected ? (
            <span className="flex flex-shrink-0 items-center gap-1 text-xs text-green-500 bg-green-50
                             dark:bg-green-900/20 px-2 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex flex-shrink-0 items-center gap-1 text-xs text-red-400 bg-red-50
                             dark:bg-red-900/20 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3">
          {isLoadingHistory ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <Send className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">
                No messages yet. Say hi! 👋
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === userId;
              return (
                <div
                  key={index}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[80%] md:max-w-xs text-sm shadow-sm break-words
                      ${isMe
                        ? "bg-gradient-to-r from-black to-yellow-500 text-white rounded-br-none"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white border dark:border-gray-700 rounded-bl-none"
                      }`}
                  >
                    {!isMe && msg.senderName && (
                      <p className="text-[10px] font-semibold text-yellow-500 mb-1">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right
                      ${isMe ? "text-white/60" : "text-gray-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-w-0 border dark:border-gray-600 rounded-full px-4 py-2
                       text-base md:text-sm bg-gray-50 dark:bg-gray-700 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-black to-yellow-500
                       flex items-center justify-center text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:opacity-90 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}