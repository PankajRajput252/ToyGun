import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client/dist/sockjs";
import { Client, TickerStrategy } from "@stomp/stompjs";
import { Bell, MessageCircle, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { API_URL, WS_URL, getAuthToken } from "../services/api";
import { enableWebPush, getServiceWorker } from "../services/webPush";

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

const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;
const PROMPT_DISMISSED_KEY = "bw-notify-prompt-dismissed";

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

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    notificationsSupported() ? Notification.permission : "unsupported"
  );
  const [promptDismissed, setPromptDismissed] = useState(() => {
    try {
      return localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  // True once the backend pushes to this browser; the service worker then shows system
  // notifications itself, so the page doesn't show a second one.
  const pushActiveRef = useRef(false);

  const requestBrowserNotifications = useCallback(() => {
    if (!notificationsSupported() || Notification.permission !== "default") return;
    getServiceWorker();
    Notification.requestPermission()
      .then((p) => setPermission(p))
      .catch(() => {});
  }, []);

  // Subscribe this browser to push whenever a user is logged in and notifications are allowed
  useEffect(() => {
    pushActiveRef.current = false;
    if (!userId || permission !== "granted") return;
    let cancelled = false;
    enableWebPush().then((ok) => {
      if (!cancelled) pushActiveRef.current = ok;
    });
    return () => {
      cancelled = true;
    };
  }, [userId, permission]);

  const dismissPrompt = () => {
    setPromptDismissed(true);
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // Register the service worker and follow its "open this chat" requests from notification clicks
  useEffect(() => {
    if (!userId) return;
    getServiceWorker();
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "navigate" && typeof e.data.url === "string") navigate(e.data.url);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [userId, navigate]);

  // Flash "(n) New message" in the tab title while the tab is hidden and there are unread messages
  const hiddenUnreadRef = useRef(0);
  const baseTitleRef = useRef<string | null>(null);
  const titleTimerRef = useRef<number | undefined>(undefined);
  const stopTitleFlash = useCallback(() => {
    window.clearInterval(titleTimerRef.current);
    titleTimerRef.current = undefined;
    hiddenUnreadRef.current = 0;
    if (baseTitleRef.current !== null) {
      document.title = baseTitleRef.current;
      baseTitleRef.current = null;
    }
  }, []);
  const startTitleFlash = useCallback(() => {
    hiddenUnreadRef.current += 1;
    if (baseTitleRef.current === null) baseTitleRef.current = document.title;
    if (titleTimerRef.current !== undefined) return;
    let on = false;
    titleTimerRef.current = window.setInterval(() => {
      on = !on;
      const n = hiddenUnreadRef.current;
      document.title = on ? `(${n}) New message${n > 1 ? "s" : ""}` : baseTitleRef.current ?? "";
    }, 1000);
  }, []);
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && stopTitleFlash();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      stopTitleFlash();
    };
  }, [stopTitleFlash]);

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

      if (document.visibilityState === "visible") return;
      startTitleFlash();

      // System (OS) notification when the tab is in the background. With web push active the
      // service worker shows it (from the server's push), so only fall back to it here.
      if (pushActiveRef.current) return;
      if (!notificationsSupported() || Notification.permission !== "granted") return;
      const title = `New message from ${msg.senderName || "a user"}`;
      const url = chatLink(msg.conversationId);
      const options: NotificationOptions = {
        body: msg.productTitle ? `${msg.content}\nRe: ${msg.productTitle}` : msg.content,
        tag: msg.conversationId, // one notification per conversation, replaced by newer messages
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: { url },
      };
      (options as NotificationOptions & { renotify?: boolean }).renotify = true; // alert again for newer messages in the same chat

      getServiceWorker()
        .then((reg) => {
          if (reg) return reg.showNotification(title, options);
          throw new Error("no service worker");
        })
        .catch(() => {
          try {
            const n = new Notification(title, options);
            n.onclick = () => {
              window.focus();
              navigate(url);
              n.close();
            };
          } catch {
            /* notifications unavailable */
          }
        });
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      // Chrome throttles setInterval in background tabs, which lets heartbeats lapse and the server
      // drop the socket. Heartbeats from a Web Worker keep running while the tab is hidden.
      heartbeatStrategy: TickerStrategy.Worker,
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
  }, [userId, markRead, navigate, startTitleFlash]);

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
      {userId && permission === "default" && !promptDismissed && !popup && (
        <div
          role="dialog"
          aria-label="Enable notifications"
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] sm:w-80 rounded-2xl border border-gray-700
                     bg-gray-900/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gold-500 text-white">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Get notified of new messages</p>
              <p className="text-xs text-gray-300">See chat alerts even when you're on another tab.</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={requestBrowserNotifications}
                  className="rounded-lg bg-gold-500 px-3 py-1 text-xs font-semibold text-white hover:bg-gold-600"
                >
                  Enable
                </button>
                <button onClick={dismissPrompt} className="rounded-lg px-3 py-1 text-xs text-gray-300 hover:bg-white/10">
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
