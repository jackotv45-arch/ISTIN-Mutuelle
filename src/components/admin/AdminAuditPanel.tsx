"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Log = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export function AdminAuditPanel() {
  const [items, setItems] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        if (active) {
          setError("Connexion indisponible.");
          setLoading(false);
        }
        return;
      }
      const { data, error: loadError } = await supabase
        .from("audit_logs")
        .select("id,actor_id,action,entity_type,entity_id,meta,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!active) return;
      if (loadError) {
        setError("Exécute setup_platform_features.sql pour activer le journal d’audit.");
        setItems([]);
      } else {
        setItems((data as Log[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Historique</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Journal d’activité</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Actions enregistrées côté administration (tickets, publications, etc.).
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
          Aucune opération enregistrée pour le moment.
        </p>
      ) : (
        <ul className="space-y-2 rounded-2xl border border-border bg-white p-4 shadow-sm">
          {items.map((log) => (
            <li key={log.id} className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-[#1c2733]">{log.action}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {log.entity_type ?? "—"}
                {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                {" · "}
                {new Date(log.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Libreville" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
