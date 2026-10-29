"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { notifyUser } from "@/lib/notifications";

type Row = {
  id: string;
  title: string;
  category: string | null;
  body: string;
  status: string;
  is_anonymous: boolean;
  is_public: boolean;
  created_at: string;
  user_id: string | null;
};

const statuses = ["received", "reviewing", "accepted", "rejected", "done"] as const;
const statusLabel: Record<string, string> = {
  received: "Reçue",
  reviewing: "En étude",
  accepted: "Acceptée",
  rejected: "Refusée",
  done: "Terminée",
};

export function AdminProposalsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase non configuré.");
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("suggestions")
      .select("id,title,category,body,status,is_anonymous,is_public,created_at,user_id")
      .order("created_at", { ascending: false });
    if (loadError) {
      setError("Impossible de charger les propositions. Exécute setup_suggestions.sql.");
      setRows([]);
    } else {
      setRows((data as Row[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateRow(id: string, patch: Partial<Pick<Row, "status" | "is_public">>) {
    setNotice("");
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const previous = rows.find((row) => row.id === id);
    const { error: upError } = await supabase
      .from("suggestions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (upError) {
      setError("Mise à jour refusée.");
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    if (previous && patch.status && patch.status !== previous.status && previous.user_id) {
      let type: "proposal_under_review" | "proposal_accepted" | "proposal_rejected" | "proposal_answered" = "proposal_answered";
      let title = "Réponse à ta proposition";
      let body = "Le bureau a mis à jour ta proposition : « " + previous.title + " ».";
      if (patch.status === "reviewing") {
        type = "proposal_under_review";
        title = "Proposition examinée";
        body = "Ta proposition « " + previous.title + " » est en cours d’examen.";
      } else if (patch.status === "accepted" || patch.status === "done") {
        type = "proposal_accepted";
        title = "Proposition retenue";
        body = "Ta proposition « " + previous.title + " » a été retenue.";
      } else if (patch.status === "rejected") {
        type = "proposal_rejected";
        title = "Retour sur ta proposition";
        body = "Ta proposition « " + previous.title + " » n’a pas été retenue. Consulte le retour du bureau.";
      }
      await notifyUser(supabase, {
        userId: previous.user_id,
        title,
        body,
        link: "/espace/propositions",
        type,
        meta: { proposal_id: previous.id, status: patch.status },
      });
    }
    setNotice("Proposition mise à jour.");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Participation</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Propositions étudiantes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Examine les idées déposées, change le statut et décide de la publication publique.
        </p>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      )}
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-bold">{row.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.category || "Sans catégorie"} ·{" "}
                  {new Date(row.created_at).toLocaleString("fr-FR")}
                  {row.is_anonymous ? " · confidentielle" : ""}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-istin-blue">
                {statusLabel[row.status] ?? row.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{row.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Statut
                <div className="mt-1 min-w-[160px]">
                  <StyledSelect
                    value={row.status}
                    onChange={(v) => void updateRow(row.id, { status: v })}
                    options={[
                      { value: "received", label: "Reçue" },
                      { value: "reviewing", label: "En étude" },
                      { value: "accepted", label: "Acceptée" },
                      { value: "rejected", label: "Refusée" },
                      { value: "done", label: "Terminée" },
                    ]}
                  />
                </div>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={row.is_public}
                  onChange={(e) => void updateRow(row.id, { is_public: e.target.checked })}
                />
                Visible sur la page publique
              </label>
            </div>
          </article>
        ))}
        {!loading && !rows.length && (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            Aucune proposition reçue pour le moment.
          </p>
        )}
      </div>
    </section>
  );
}
