"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationsPanel({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Connexion indisponible.");
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("id,title,body,link,is_read,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (loadError) {
      setError("Impossible de charger les notifications. Vérifie setup_platform_features.sql.");
      setItems([]);
    } else {
      setItems((data as Notif[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [userId]);

  async function markRead(id: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);
    setItems((current) => current.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setItems((current) => current.map((n) => ({ ...n, is_read: true })));
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
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-8 shadow-sm">
        <h2 className="font-heading text-xl font-bold text-[#1c2733]">Aucune notification</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Les alertes de la mutuelle (événements, réponses, sondages) s’afficheront ici.
        </p>
      </section>
    );
  }

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <section className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} non lue(s)` : "Toutes lues"}
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
              "rounded-2xl border p-4 shadow-sm " +
              (n.is_read ? "border-border bg-white" : "border-istin-blue/25 bg-[#eef5fb]")
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
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
                  className="text-xs font-semibold text-istin-blue hover:underline"
                >
                  Marquer lu
                </button>
              )}
            </div>
            {n.link && (
              <Link href={n.link} className="mt-3 inline-block text-sm font-semibold text-istin-blue hover:underline">
                Ouvrir →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
