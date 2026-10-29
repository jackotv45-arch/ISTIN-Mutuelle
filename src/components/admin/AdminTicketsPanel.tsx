"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  body: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const statuses = [
  { value: "open", label: "Ouverte" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Traitée" },
  { value: "closed", label: "Fermée" },
];

export function AdminTicketsPanel() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Connexion indisponible.");
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("support_tickets")
      .select("id,user_id,subject,category,body,status,admin_note,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (loadError) {
      setError("Exécute setup_platform_features.sql pour activer les demandes.");
      setItems([]);
    } else {
      setItems((data as Ticket[]) ?? []);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateTicket(id: string, patch: Partial<Ticket>) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { error: upError } = await supabase
      .from("support_tickets")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upError) {
      setError(upError.message);
      return;
    }
    await supabase.rpc("write_audit_log", {
      p_action: "ticket.update",
      p_entity_type: "support_tickets",
      p_entity_id: id,
      p_meta: patch,
    });
    // notify student
    const ticket = items.find((t) => t.id === id);
    if (ticket) {
      await supabase.from("notifications").insert({
        user_id: ticket.user_id,
        title: "Mise à jour de ta demande",
        body: `« ${ticket.subject} » — statut : ${patch.status ?? ticket.status}`,
        link: "/espace/demandes",
      });
    }
    await load();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Bureau</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Demandes des étudiants</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tickets envoyés depuis l’espace étudiant. Mets à jour le statut et laisse une note de réponse.
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
          Aucune demande pour le moment.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((t) => (
            <li key={t.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-lg font-bold">{t.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.category} ·{" "}
                    {new Date(t.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Libreville" })}
                  </p>
                </div>
                <div className="min-w-[160px]">
                  <StyledSelect
                    value={t.status}
                    onChange={(v) => void updateTicket(t.id, { status: v })}
                    options={statuses}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{t.body}</p>
              <label className="mt-4 block text-sm font-medium">
                Note / réponse du bureau
                <textarea
                  defaultValue={t.admin_note ?? ""}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border p-3"
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value !== (t.admin_note ?? "")) {
                      void updateTicket(t.id, { admin_note: value });
                    }
                  }}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
