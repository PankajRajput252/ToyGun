import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client, TickerStrategy } from "@stomp/stompjs";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { WS_URL } from "../services/api";
import { AppNotification, notificationApi } from "../services/notificationApi";

// Admin notifications: unread count for the bell in the admin header, plus live arrivals over
// STOMP /topic/notifications/{myNodeId}. Does nothing for customers.

interface NotificationContextType {
  unread: number;
  /** Re-reads the unread count from the server (after marking things read). */
  refreshCounts: () => void;
  /** Lets the open panel/page add new notifications live. Returns an unsubscribe function. */
  onNotification: (listener: (n: AppNotification) => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();
  const nodeId: string | undefined = isAuthenticated && isAdmin ? user?.nodeId : undefined;

  const [unread, setUnread] = useState(0);
  const listenersRef = useRef(new Set<(n: AppNotification) => void>());
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const refreshCounts = useCallback(() => {
    if (!nodeId) return setUnread(0);
    notificationApi.unreadCount().then((r) => setUnread(r.count)).catch(() => {});
  }, [nodeId]);

  useEffect(refreshCounts, [refreshCounts]);

  // Catch up when coming back to the tab (the socket may have been asleep)
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && refreshCounts();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshCounts]);

  useEffect(() => {
    if (!nodeId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatStrategy: TickerStrategy.Worker,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${nodeId}`, (frame) => {
          try {
            const n = JSON.parse(frame.body) as AppNotification;
            setUnread((c) => c + 1);
            listenersRef.current.forEach((l) => l(n));
            toastRef.current(`${n.actorName ?? "Bandookwale"} ${n.action}`, "info");
          } catch (err) {
            console.error("Bad notification", err);
          }
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [nodeId]);

  const onNotification = useCallback((listener: (n: AppNotification) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ unread, refreshCounts, onNotification }}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
