"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  body: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const categories = [
  { value: "general", label: "Question générale" },
  { value: "event", label: "Événement / inscription" },
  { value: "finance", label: "Finance / cotisation" },
  { value: "document", label: "Document / attestation" },
  { value: "other", label: "Autre" },
];

const statusLabel: Record<string, string> = {
  open: "Ouverte",
  in_progress: "En cours",
  resolved: "Traitée",
  closed: "Fermée",
};

export function StudentTicketForm({ userId }: { userId: string }) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
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
      .select("id,subject,category,body,status,admin_note,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (loadError) {
      setError("Impossible de charger les demandes. Exécute setup_platform_features.sql.");
      setItems([]);
    } else {
      setItems((data as Ticket[]) ?? []);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [userId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setBusy(false);
      setError("Connexion indisponible.");
      return;
    }
    const { error: insertError } = await supabase.from("support_tickets").insert({
      user_id: userId,
      subject: subject.trim(),
      category,
      body: body.trim(),
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message || "Envoi impossible.");
      return;
    }
    setSubject("");
    setBody("");
    setCategory("general");
    setNotice("Demande envoyée au bureau.");
    await load();
  }

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">Nouvelle demande</h2>
        <label className="block text-sm font-medium">
          Sujet
          <input
            required
            maxLength={140}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-border px-3"
            placeholder="Ex. Demande d’attestation"
          />
        </label>
        <label className="block text-sm font-medium">
          Catégorie
          <div className="mt-1">
            <StyledSelect value={category} onChange={setCategory} options={categories} />
          </div>
        </label>
        <label className="block text-sm font-medium">
          Message
          <textarea
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border p-3"
            placeholder="Décris ta demande…"
          />
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
        <button disabled={busy} className="btn btn-primary disabled:opacity-60">
          {busy ? "Envoi…" : "Envoyer au bureau"}
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">Mes demandes</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucune demande pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((t) => (
              <li key={t.id} className="rounded-xl border border-border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{t.subject}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-istin-blue">
                    {statusLabel[t.status] ?? t.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{t.body}</p>
                {t.admin_note && (
                  <p className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-700">
                    <strong>Réponse du bureau :</strong> {t.admin_note}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Libreville" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
