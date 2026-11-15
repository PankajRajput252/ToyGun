// Service worker: shows chat notifications pushed by the backend (Web Push), even when no
// Bandookwale tab is open, and focuses / opens the site when a notification is clicked.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    (async () => {
      // A visible Bandookwale tab already shows the in-app message card
      const tabs = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (tabs.some((c) => c.visibilityState === "visible")) return;

      await self.registration.showNotification(data.title || "Bandookwale", {
        body: data.body || "You have a new message",
        tag: data.tag || undefined, // one notification per conversation, replaced by newer messages
        renotify: Boolean(data.tag), // ...but still alert for each new message
        icon: "/favicon.png",
        badge: "/favicon.png",
        data: { url: data.url || "/chat" },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const tab = all.find((c) => new URL(c.url).origin === self.location.origin);
      if (tab) {
        await tab.focus();
        tab.postMessage({ type: "navigate", url });
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
