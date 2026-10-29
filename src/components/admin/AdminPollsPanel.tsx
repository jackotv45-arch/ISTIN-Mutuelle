"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Poll = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "open" | "closed";
  results_public: boolean;
  created_at: string;
};

type Option = { id: string; poll_id: string; label: string; position: number };

const statusLabel: Record<string, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  closed: "Fermé",
};

export function AdminPollsPanel() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [optionsByPoll, setOptionsByPoll] = useState<Record<string, Option[]>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [optionsText, setOptionsText] = useState("Oui\nNon");
  const [resultsPublic, setResultsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase non configuré.");
      setLoading(false);
      return;
    }
    const { data: pollRows, error: pollError } = await supabase
      .from("polls")
      .select("id,title,description,status,results_public,created_at")
      .order("created_at", { ascending: false });
    if (pollError) {
      setError("Impossible de charger les sondages. Exécute supabase/setup_polls.sql.");
      setPolls([]);
      setLoading(false);
      return;
    }
    const list = (pollRows as Poll[]) ?? [];
    setPolls(list);
    if (list.length) {
      const { data: opts } = await supabase
        .from("poll_options")
        .select("id,poll_id,label,position")
        .in(
          "poll_id",
          list.map((p) => p.id),
        )
        .order("position", { ascending: true });
      const map: Record<string, Option[]> = {};
      for (const opt of (opts as Option[]) ?? []) {
        (map[opt.poll_id] ??= []).push(opt);
      }
      setOptionsByPoll(map);
    } else {
      setOptionsByPoll({});
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createPoll(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const labels = optionsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (title.trim().length < 3 || labels.length < 2) {
      setError("Indique un titre et au moins deux options (une par ligne).");
      setBusy(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setBusy(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: poll, error: insertError } = await supabase
      .from("polls")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        status: "draft",
        results_public: resultsPublic,
        created_by: user?.id ?? null,
      })
      .select("id,title,description,status,results_public,created_at")
      .single();
    if (insertError || !poll) {
      setError("Création refusée. Vérifie setup_polls.sql et ton rôle admin.");
      setBusy(false);
      return;
    }
    const rows = labels.map((label, index) => ({
      poll_id: poll.id,
      label,
      position: index,
    }));
    const { error: optError } = await supabase.from("poll_options").insert(rows);
    setBusy(false);
    if (optError) {
      setError("Sondage créé mais options incomplètes.");
      await load();
      return;
    }
    setTitle("");
    setDescription("");
    setOptionsText("Oui\nNon");
    setNotice("Sondage créé en brouillon. Ouvre-le pour le rendre visible aux étudiants.");
    await load();
  }

  async function setStatus(id: string, status: Poll["status"]) {
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { error: upError } = await supabase.from("polls").update({ status }).eq("id", id);
    if (upError) {
      setError("Mise à jour du statut refusée.");
      return;
    }
    setPolls((current) => current.map((p) => (p.id === id ? { ...p, status } : p)));
    setNotice(status === "open" ? "Sondage ouvert aux étudiants." : "Statut mis à jour.");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Participation</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Sondages et votes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crée un sondage, ajoute des options, puis ouvre-le pour que les étudiants puissent voter.
        </p>
      </div>

      <form onSubmit={createPoll} className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="font-heading text-lg font-bold">Nouveau sondage</h2>
        <label className="block text-sm font-medium">
          Question / titre
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="mt-1 h-11 w-full rounded-xl border border-border px-3"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Description (facultatif)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={1000}
            className="mt-1 w-full rounded-xl border border-border p-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Options (une par ligne, minimum 2)
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-border p-3 font-mono text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={resultsPublic}
            onChange={(e) => setResultsPublic(e.target.checked)}
          />
          Afficher les résultats aux étudiants après leur vote
        </label>
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
        <button disabled={busy} className="btn btn-primary disabled:opacity-60">
          {busy ? "Création…" : "Créer le sondage"}
        </button>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {polls.map((poll) => (
          <article key={poll.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-bold">{poll.title}</h2>
                {poll.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{poll.description}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(poll.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-istin-blue">
                {statusLabel[poll.status]}
              </span>
            </div>
            <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
              {(optionsByPoll[poll.id] ?? []).map((opt) => (
                <li key={opt.id}>{opt.label}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {poll.status !== "open" && (
                <button
                  type="button"
                  onClick={() => void setStatus(poll.id, "open")}
                  className="rounded-lg bg-istin-blue px-3 py-2 text-xs font-semibold text-white"
                >
                  Ouvrir le vote
                </button>
              )}
              {poll.status === "open" && (
                <button
                  type="button"
                  onClick={() => void setStatus(poll.id, "closed")}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold"
                >
                  Fermer le vote
                </button>
              )}
              {poll.status === "closed" && (
                <button
                  type="button"
                  onClick={() => void setStatus(poll.id, "open")}
                  className="rounded-lg border border-istin-blue/30 px-3 py-2 text-xs font-semibold text-istin-blue"
                >
                  Rouvrir
                </button>
              )}
            </div>
          </article>
        ))}
        {!loading && !polls.length && (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
            Aucun sondage pour le moment. Crée le premier ci-dessus.
          </p>
        )}
      </div>
    </section>
  );
}
