import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
import { Send, Wifi, WifiOff, MessageSquare } from "lucide-react";
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
};

// const WS_URL = "http://bandookwala-env.eba-bih9jrqy.ap-south-1.elasticbeanstalk.com/ws"; // ← update to your backend URL
// const API_URL = "http://bandookwala-env.eba-bih9jrqy.ap-south-1.elasticbeanstalk.com";

export default function ChatUI({
  conversationId,
  userId,
  userName = "Me",
  productTitle = "Product",
  productImage = "",
  sellerName = "Seller",
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState(conversationId);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);

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
    setMessages(Array.isArray(data) ? data : []);

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
    setConversations(Array.isArray(data) ? data : []);

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
        subscribeToConversation(client, activeConvId);
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
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">

      {/* SIDEBAR */}
      <div className="w-1/4 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">

        {/* Sidebar Header */}
        <div className="p-4 font-bold text-lg border-b dark:border-gray-700
                        text-gray-800 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-yellow-500" />
          Chats
        </div>

        {/* Current conversation (from product) */}
        <div
          onClick={() => switchConversation(conversationId)}
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
              <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                {sellerName}
              </p>
              <p className="text-xs text-gray-400 truncate">{productTitle}</p>
            </div>
          </div>
        </div>

        {/* Other conversations */}
        {conversations
          .filter((c) => c.conversationId !== conversationId)
          .map((conv) => (
            <div
              key={conv.conversationId}
              onClick={() => switchConversation(conv.conversationId)}
              className={`p-4 cursor-pointer border-b dark:border-gray-700 transition
                ${activeConvId === conv.conversationId
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
            >
              <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                {conv.sellerName || "Seller"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {conv.lastMessage || conv.productTitle || conv.conversationId}
              </p>
            </div>
          ))}
      </div>

      {/* CHAT WINDOW */}
      <div className="flex flex-col flex-1">

        {/* Chat Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700
                        flex items-center gap-3 shadow-sm">
          {productImage && (
            <img
              src={productImage}
              alt={productTitle}
              className="w-9 h-9 rounded-lg object-cover border flex-shrink-0"
              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/36"; }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white">{sellerName}</p>
            <p className="text-xs text-gray-400 truncate">Re: {productTitle}</p>
          </div>

          {/* Connection badge */}
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-500 bg-green-50
                             dark:bg-green-900/20 px-2 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-50
                             dark:bg-red-900/20 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
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
                    className={`px-4 py-2 rounded-2xl max-w-xs text-sm shadow-sm
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
        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 border dark:border-gray-600 rounded-full px-4 py-2
                       text-sm bg-gray-50 dark:bg-gray-700 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-black to-yellow-500
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