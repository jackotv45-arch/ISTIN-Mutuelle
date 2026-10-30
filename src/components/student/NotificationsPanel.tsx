"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { notificationTypeLabel } from "@/lib/notifications";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type?: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationsPanel({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase non configuré.");
      setLoading(false);
      return;
    }
    const { data, error: qError } = await supabase
      .from("notifications")
      .select("id,title,body,link,type,is_read,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (qError) {
      // fallback without type column if SQL phase1 not applied yet
      const retry = await supabase
        .from("notifications")
        .select("id,title,body,link,is_read,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (retry.error) {
        setError("Impossible de charger les notifications. Exécute setup_notifications_phase1.sql puis setup_platform_features.sql.");
        setItems([]);
      } else {
        setItems((retry.data as Notif[]) ?? []);
        setError("");
      }
    } else {
      setItems((data as Notif[]) ?? []);
      setError("");
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);
    setItems((current) => current.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    window.dispatchEvent(new Event("istin-notifications-changed"));
  }

  async function markAllRead() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setItems((current) => current.map((n) => ({ ...n, is_read: true })));
    window.dispatchEvent(new Event("istin-notifications-changed"));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement des notifications…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {error}
      </p>
    );
  }

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-8 shadow-sm">
        <h2 className="font-heading text-xl font-bold text-[#1c2733]">Aucune notification</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Les alertes de la mutuelle (événements, sondages, réponses du bureau, actualités) s’afficheront ici.
        </p>
      </section>
    );
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <section className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Toutes lues"}
        </p>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-sm font-semibold text-istin-blue hover:underline"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={
              "rounded-2xl border p-4 shadow-sm transition-colors " +
              (n.is_read ? "border-border bg-white" : "border-istin-blue/25 bg-[#eef5fb]")
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-istin-blue/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-istin-blue">
                    {notificationTypeLabel(n.type)}
                  </span>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-istin-red" title="Non lue" />
                  )}
                </div>
                <p className="font-semibold text-[#1c2733]">{n.title}</p>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Libreville" })}
                </p>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => void markRead(n.id)}
                  className="shrink-0 text-xs font-semibold text-istin-blue hover:underline"
                >
                  Marquer lu
                </button>
              )}
            </div>
            {n.link && (
              <Link
                href={n.link}
                onClick={() => {
                  if (!n.is_read) void markRead(n.id);
                }}
                className="mt-3 inline-block text-sm font-semibold text-istin-blue hover:underline"
              >
                Ouvrir →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
