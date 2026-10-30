"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isPushConfigured, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";

function replayPendingWelcomePush() {
  void fetch("/api/push/notify", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliverPendingWelcome: true }),
  }).catch(() => {});
}

export function EnablePushToggle({ userId }: { userId: string }) {
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setConfigured(isPushConfigured());
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    void navigator.serviceWorker.ready
      .then(async (reg) => {
        const subscription = await reg.pushManager.getSubscription();
        if (!subscription) return false;
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return false;
        const { data } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("endpoint", subscription.endpoint)
          .maybeSingle();
        return Boolean(data);
      })
      .then((isRegistered) => {
        setEnabled(isRegistered);
        if (isRegistered) replayPendingWelcomePush();
      })
      .catch(() => setEnabled(false));
  }, [userId]);

  async function enable() {
    setBusy(true);
    setMessage("");
    const result = await subscribeToPush();
    if (!result.ok) {
      setMessage(result.error);
      setBusy(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const endpoint = result.subscription.endpoint;
    const p256dh = result.subscription.keys?.p256dh;
    const auth = result.subscription.keys?.auth;
    if (!supabase || !endpoint || !p256dh || !auth) {
      await unsubscribeFromPush();
      setMessage("Abonnement navigateur OK, mais enregistrement serveur impossible.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" },
    );
    setBusy(false);
    if (error) {
      await unsubscribeFromPush();
      setMessage("Active d’abord setup_push_subscriptions.sql dans Supabase. " + error.message);
      return;
    }
    setEnabled(true);
    replayPendingWelcomePush();
    setMessage("Notifications push activées sur cet appareil.");
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    const result = await unsubscribeFromPush();
    if (result.error) {
      setBusy(false);
      setMessage(result.error);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (supabase && result.endpoint) {
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", result.endpoint);
      if (error) {
        setEnabled(false);
        setBusy(false);
        setMessage("Alertes désactivées sur cet appareil, mais son abonnement n’a pas pu être supprimé du serveur.");
        return;
      }
    }
    setEnabled(false);
    setBusy(false);
    setMessage("Notifications push désactivées sur cet appareil.");
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Les notifications système ne sont pas disponibles sur ce navigateur. Les alertes in-app restent actives.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="font-heading text-lg font-bold text-[#1c2733]">Notifications sur l’appareil</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Reçois une alerte même si le site est fermé (après installation PWA ou sur navigateur compatible).
      </p>
      {!configured && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Configuration serveur en attente (clés VAPID). Les notifications dans l’espace étudiant fonctionnent déjà.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {!enabled ? (
          <button
            type="button"
            disabled={busy || !configured}
            onClick={() => void enable()}
            className="btn btn-primary disabled:opacity-50"
          >
            {busy ? "Activation…" : "Activer les alertes"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void disable()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {busy ? "…" : "Désactiver sur cet appareil"}
          </button>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
