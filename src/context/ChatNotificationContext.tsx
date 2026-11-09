import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
import { MessageCircle, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { API_URL, WS_URL, getAuthToken } from "../services/api";

// App-wide chat notifications: one socket per logged-in tab listening on /topic/inbox/{myId},
// which the backend uses for every message addressed to me, in any conversation.

export interface IncomingChatMessage {
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  productTitle?: string;
  productImage?: string;
}

interface ChatNotificationContextType {
  /** Total unread messages across conversations (header badge). */
  unreadTotal: number;
  unreadByConversation: Record<string, number>;
  /** The chat window tells us which conversation is on screen, so it isn't counted or notified. */
  setActiveConversation: (conversationId: string | null) => void;
  markRead: (conversationId: string) => void;
  /** Lets the chat page update its list live. Returns an unsubscribe function. */
  onIncoming: (listener: (msg: IncomingChatMessage) => void) => () => void;
  /** Ask for browser notification permission; call from a click. */
  requestBrowserNotifications: () => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | null>(null);

const chatLink = (conversationId: string) => `/chat?c=${encodeURIComponent(conversationId)}`;

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId: string | undefined = user?.nodeId;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [unreadByConversation, setUnread] = useState<Record<string, number>>({});
  const [popup, setPopup] = useState<IncomingChatMessage | null>(null);
  const activeConvRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  const listenersRef = useRef(new Set<(msg: IncomingChatMessage) => void>());
  const popupTimerRef = useRef<number | undefined>(undefined);

  pathnameRef.current = pathname;

  const markRead = useCallback(
    (conversationId: string) => {
      if (!userId || !conversationId) return;
      setUnread((prev) => {
        if (!prev[conversationId]) return prev;
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
      const token = getAuthToken();
      fetch(`${API_URL}/api/chat/read/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).catch(() => { /* best effort; the badge is already cleared locally */ });
    },
    [userId]
  );

  const setActiveConversation = useCallback(
    (conversationId: string | null) => {
      activeConvRef.current = conversationId;
      if (conversationId) markRead(conversationId);
    },
    [markRead]
  );

  const onIncoming = useCallback((listener: (msg: IncomingChatMessage) => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const requestBrowserNotifications = useCallback(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Unread counts from the server when the user logs in
  useEffect(() => {
    setUnread({});
    if (!userId) return;
    let cancelled = false;
    fetch(`${API_URL}/api/chat/unread/${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.conversations) setUnread(data.conversations);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Live inbox socket
  useEffect(() => {
    if (!userId) return;

    const handle = (msg: IncomingChatMessage) => {
      if (!msg?.conversationId || msg.senderId === userId) return;
      listenersRef.current.forEach((l) => l(msg));

      const viewing =
        activeConvRef.current === msg.conversationId &&
        pathnameRef.current === "/chat" &&
        document.visibilityState === "visible";
      if (viewing) {
        markRead(msg.conversationId);
        return;
      }

      setUnread((prev) => ({ ...prev, [msg.conversationId]: (prev[msg.conversationId] ?? 0) + 1 }));

      // In-app card
      setPopup(msg);
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = window.setTimeout(() => setPopup(null), 7000);

      // System notification when the tab is in the background
      if (document.visibilityState !== "visible" && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const n = new Notification(`New message from ${msg.senderName || "a user"}`, {
            body: msg.productTitle ? `${msg.content}\n${msg.productTitle}` : msg.content,
            tag: msg.conversationId, // one notification per conversation, replaced by newer messages
            icon: "/favicon.png",
          });
          n.onclick = () => {
            window.focus();
            navigate(chatLink(msg.conversationId));
            n.close();
          };
        } catch {
          /* some mobile browsers only allow notifications from a service worker */
        }
      }
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/inbox/${userId}`, (frame) => {
          try {
            handle(JSON.parse(frame.body));
          } catch (err) {
            console.error("Bad chat notification", err);
          }
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [userId, markRead, navigate]);

  useEffect(() => () => window.clearTimeout(popupTimerRef.current), []);

  // Coming back to a tab that shows the conversation: messages that arrived meanwhile are now read
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && pathnameRef.current === "/chat" && activeConvRef.current) {
        markRead(activeConvRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead]);

  // Hide the card once the user is looking at that conversation
  useEffect(() => {
    if (popup && pathname === "/chat" && activeConvRef.current === popup.conversationId) setPopup(null);
  }, [pathname, popup]);

  const unreadTotal = Object.values(unreadByConversation).reduce((a, b) => a + b, 0);

  return (
    <ChatNotificationContext.Provider
      value={{ unreadTotal, unreadByConversation, setActiveConversation, markRead, onIncoming, requestBrowserNotifications }}
    >
      {children}
      {popup && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] sm:w-80 rounded-2xl border border-gray-700
                     bg-gray-900/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => {
                setPopup(null);
                navigate(chatLink(popup.conversationId));
              }}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              {popup.productImage ? (
                <img src={popup.productImage} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gold-500 text-white">
                  <MessageCircle className="h-5 w-5" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{popup.senderName || "New message"}</span>
                <span className="line-clamp-2 block text-sm text-gray-300">{popup.content}</span>
                {popup.productTitle && <span className="block truncate text-xs text-gray-500">Re: {popup.productTitle}</span>}
                <span className="mt-1 block text-xs font-semibold text-gold-400">Open chat →</span>
              </span>
            </button>
            <button onClick={() => setPopup(null)} aria-label="Dismiss" className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) throw new Error("useChatNotifications must be used inside ChatNotificationProvider");
  return ctx;
}
