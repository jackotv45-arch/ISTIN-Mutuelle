/* ISTIN MUTUELLE — service worker (v3)
 * - Réseau d'abord pour les pages
 * - Cache des assets immuables Next
 * - Notifications push (si abonnement actif)
 */
const CACHE = "istin-mutuelle-v3";
const OFFLINE_URLS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("istin-mutuelle") && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isImmutableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/espace")) return;
  if (req.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "ISTIN MUTUELLE", body: "Nouvelle notification", url: "/espace/notifications" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    try {
      if (event.data) payload.body = event.data.text();
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "ISTIN MUTUELLE", {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/espace/notifications" },
      lang: "fr",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/espace/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    }),
  );
});
