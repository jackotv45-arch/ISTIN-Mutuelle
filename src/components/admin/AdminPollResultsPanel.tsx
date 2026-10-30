"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Poll = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "open" | "closed";
  created_at: string;
};

type Option = { id: string; poll_id: string; label: string; position: number };
type Vote = { poll_id: string; option_id: string };

const statusLabel: Record<Poll["status"], string> = {
  draft: "Brouillon",
  open: "Ouvert",
  closed: "Fermé",
};

export function AdminPollResultsPanel() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedPollId, setSelectedPollId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La connexion Supabase n’est pas configurée.");
      setLoading(false);
      return;
    }

    const { data: pollRows, error: pollError } = await supabase
      .from("polls")
      .select("id,title,description,status,created_at")
      .order("created_at", { ascending: false });
    if (pollError) {
      setPolls([]);
      setOptions([]);
      setVotes([]);
      setError("Impossible de charger les sondages. Vérifie setup_polls.sql et les droits administrateur.");
      setLoading(false);
      return;
    }

    const pollList = (pollRows ?? []) as Poll[];
    setPolls(pollList);
    setSelectedPollId((current) =>
      pollList.some((poll) => poll.id === current) ? current : pollList[0]?.id ?? "",
    );
    if (!pollList.length) {
      setOptions([]);
      setVotes([]);
      setLoading(false);
      return;
    }

    const pollIds = pollList.map((poll) => poll.id);
    const [optionsResult, votesResult] = await Promise.all([
      supabase
        .from("poll_options")
        .select("id,poll_id,label,position")
        .in("poll_id", pollIds)
        .order("position", { ascending: true }),
      supabase
        .from("poll_votes")
        .select("poll_id,option_id")
        .in("poll_id", pollIds),
    ]);

    if (optionsResult.error || votesResult.error) {
      setOptions([]);
      setVotes([]);
      setError("Impossible de charger les votes. Vérifie les règles de lecture des sondages.");
      setLoading(false);
      return;
    }

    setOptions((optionsResult.data ?? []) as Option[]);
    setVotes((votesResult.data ?? []) as Vote[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedPoll = polls.find((poll) => poll.id === selectedPollId) ?? null;
  const selectedOptions = options.filter((option) => option.poll_id === selectedPollId);
  const selectedVotes = votes.filter((vote) => vote.poll_id === selectedPollId);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Participation</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold">Résultats des sondages</h1>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-istin-blue/30 px-3 py-2 text-sm font-semibold text-istin-blue disabled:opacity-60"
          >
            {loading ? "Actualisation…" : "Actualiser"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Les résultats sont regroupés par option. Aucun nom de votant n’est affiché.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {error}
        </p>
      )}

      {polls.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
          <label className="block max-w-xl text-sm font-semibold">
            Choisir un sondage
            <select
              value={selectedPollId}
              onChange={(event) => setSelectedPollId(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 font-normal"
            >
              {polls.map((poll) => (
                <option key={poll.id} value={poll.id}>{poll.title} · {statusLabel[poll.status]}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Chargement des résultats…</p>}
      {!loading && !error && selectedPoll && (
        <article className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold">{selectedPoll.title}</h2>
              {selectedPoll.description && (
                <p className="mt-1 text-sm text-muted-foreground">{selectedPoll.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Créé le {new Date(selectedPoll.created_at).toLocaleDateString("fr-FR")} · {statusLabel[selectedPoll.status]}
              </p>
            </div>
            <span className="rounded-full bg-[#eef5fb] px-3 py-1.5 text-sm font-bold text-[#0b63ab]">
              {selectedVotes.length} vote{selectedVotes.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {selectedOptions.map((option) => {
              const count = selectedVotes.filter((vote) => vote.option_id === option.id).length;
              const percentage = selectedVotes.length ? Math.round((count / selectedVotes.length) * 100) : 0;
              return (
                <div key={option.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800">{option.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {count} vote{count === 1 ? "" : "s"} · {percentage}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${option.label}: ${percentage}% des votes`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <div className="h-full rounded-full bg-istin-blue transition-[width]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
            {!selectedOptions.length && (
              <p className="text-sm text-muted-foreground">Ce sondage ne contient pas d’options.</p>
            )}
            {selectedOptions.length > 0 && selectedVotes.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun vote enregistré pour le moment.</p>
            )}
          </div>
        </article>
      )}

      {!loading && !error && !polls.length && (
        <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
          Aucun sondage enregistré.
        </p>
      )}
    </section>
  );
}
