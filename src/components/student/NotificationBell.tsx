"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AppBadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

async function syncAppBadge(count: number) {
  const badgeNavigator = navigator as AppBadgeNavigator;
  try {
    if (count > 0) {
      await badgeNavigator.setAppBadge?.(count);
    } else if (badgeNavigator.clearAppBadge) {
      await badgeNavigator.clearAppBadge();
    } else {
      await badgeNavigator.setAppBadge?.(0);
    }
  } catch {
    // Le navigateur ou le système peut ne pas prendre en charge le badge d’application.
  }
}

export function NotificationBell({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error && typeof count === "number") {
      setUnread(count);
      void syncAppBadge(count);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    const refresh = () => void load();
    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "notifications-changed") void load();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("istin-notifications-changed", refresh);
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("istin-notifications-changed", refresh);
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
    };
  }, [load]);

  return (
    <Link
      href="/espace/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-istin-blue shadow-sm hover:bg-[#eef5fb]"
      aria-label={unread > 0 ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-istin-red px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
