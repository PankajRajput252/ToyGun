import { API_URL, getAuthToken } from "./api";

// Browser push (Web Push / VAPID): the backend sends chat alerts to this browser even when
// no Bandookwale tab is open. public/sw.js receives them and shows the notification.

let swRegistration: Promise<ServiceWorkerRegistration | null> | null = null;

/** Registers /sw.js once per page load. Resolves to null when service workers aren't available. */
export function getServiceWorker() {
  if (!swRegistration) {
    swRegistration =
      typeof navigator !== "undefined" && "serviceWorker" in navigator
        ? navigator.serviceWorker
            .register("/sw.js")
            .then(() => navigator.serviceWorker.ready)
            .catch(() => null)
        : Promise.resolve(null);
  }
  return swRegistration;
}

export const webPushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function base64UrlToBytes(value: string) {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameBytes(a: ArrayBuffer | null | undefined, b: Uint8Array) {
  if (!a || a.byteLength !== b.length) return false;
  const view = new Uint8Array(a);
  return view.every((v, i) => v === b[i]);
}

/**
 * Subscribes this browser to push for the logged-in user and registers it with the backend.
 * Safe to call on every page load. Returns true when the server will push to this browser.
 */
export async function enableWebPush(): Promise<boolean> {
  try {
    if (!webPushSupported() || Notification.permission !== "granted") return false;
    const token = getAuthToken();
    if (!token) return false;

    const reg = await getServiceWorker();
    if (!reg) return false;

    const res = await fetch(`${API_URL}/api/push/web/public-key`);
    if (!res.ok) return false;
    const { enabled, publicKey } = (await res.json()) as { enabled?: boolean; publicKey?: string };
    if (!enabled || !publicKey) return false;
    const serverKey = base64UrlToBytes(publicKey);

    let sub = await reg.pushManager.getSubscription();
    if (sub && !sameBytes(sub.options.applicationServerKey, serverKey)) {
      // The server's keys changed; the old subscription can't receive pushes anymore
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey });
    }

    const saved = await fetch(`${API_URL}/api/push/web/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sub.toJSON()),
    });
    return saved.ok;
  } catch (err) {
    console.warn("Web push unavailable", err);
    return false;
  }
}

/** On logout: stop this browser receiving the signed-out user's chats. Pass the token before it is cleared. */
export async function disableWebPush(token: string | null = getAuthToken()) {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    if (token) {
      await fetch(`${API_URL}/api/push/web/subscriptions?endpoint=${encodeURIComponent(sub.endpoint)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    await sub.unsubscribe();
  } catch {
    /* best effort */
  }
}
