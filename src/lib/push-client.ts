"use client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

export function isPushConfigured() {
  return Boolean(getVapidPublicKey());
}

export async function subscribeToPush(): Promise<
  { ok: true; subscription: PushSubscriptionJSON } | { ok: false; error: string }
> {
  if (typeof window === "undefined") return { ok: false, error: "Indisponible côté serveur." };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Ce navigateur ne prend pas en charge les notifications push." };
  }
  const key = getVapidPublicKey();
  if (!key) {
    return {
      ok: false,
      error: "Les notifications push ne sont pas encore configurées (clé VAPID manquante).",
    };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Permission refusée. Tu peux l’activer dans les réglages du navigateur." };
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  return { ok: true, subscription: sub.toJSON() };
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}
