"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Poll = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  results_public: boolean;
};

type Option = { id: string; poll_id: string; label: string; position: number };

export function StudentPollsPanel({ userId }: { userId: string }) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [optionsByPoll, setOptionsByPoll] = useState<Record<string, Option[]>>({});
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Connexion indisponible.");
      setLoading(false);
      return;
    }

    const { data: pollRows, error: pollError } = await supabase
      .from("polls")
      .select("id,title,description,status,results_public")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (pollError) {
      setError("Impossible de charger les sondages pour le moment.");
      setPolls([]);
      setLoading(false);
      return;
    }

    const list = (pollRows as Poll[]) ?? [];
    setPolls(list);

    if (!list.length) {
      setOptionsByPoll({});
      setMyVotes({});
      setCounts({});
      setLoading(false);
      return;
    }

    const ids = list.map((p) => p.id);
    const [{ data: opts }, { data: votes }] = await Promise.all([
      supabase
        .from("poll_options")
        .select("id,poll_id,label,position")
        .in("poll_id", ids)
        .order("position", { ascending: true }),
      supabase.from("poll_votes").select("poll_id,option_id").eq("user_id", userId).in("poll_id", ids),
    ]);

    const map: Record<string, Option[]> = {};
    for (const opt of (opts as Option[]) ?? []) {
      (map[opt.poll_id] ??= []).push(opt);
    }
    setOptionsByPoll(map);

    const voteMap: Record<string, string> = {};
    for (const v of votes ?? []) {
      voteMap[v.poll_id] = v.option_id;
    }
    setMyVotes(voteMap);

    // Résultats agrégés uniquement pour les sondages déjà votés et publics
    const publicVoted = list.filter((p) => p.results_public && voteMap[p.id]).map((p) => p.id);
    if (publicVoted.length) {
      const { data: allVotes } = await supabase
        .from("poll_votes")
        .select("option_id")
        .in("poll_id", publicVoted);
      const c: Record<string, number> = {};
      for (const row of allVotes ?? []) {
        c[row.option_id] = (c[row.option_id] ?? 0) + 1;
      }
      setCounts(c);
    } else {
      setCounts({});
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [userId]);

  async function vote(pollId: string, optionId: string) {
    if (myVotes[pollId]) return;
    setBusyId(pollId);
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setBusyId(null);
      return;
    }
    const { error: voteError } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    });
    setBusyId(null);
    if (voteError) {
      setError("Vote refusé. Tu as peut-être déjà voté, ou le sondage est fermé.");
      return;
    }
    setNotice("Ton vote a été enregistré.");
    await load();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement des sondages…</p>;
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}

      {polls.map((poll) => {
        const options = optionsByPoll[poll.id] ?? [];
        const votedOption = myVotes[poll.id];
        const total =
          poll.results_public && votedOption
            ? options.reduce((sum, o) => sum + (counts[o.id] ?? 0), 0)
            : 0;

        return (
          <article key={poll.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-[#1c2733]">{poll.title}</h2>
            {poll.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{poll.description}</p>
            )}
            <div className="mt-5 space-y-2">
              {options.map((opt) => {
                const selected = votedOption === opt.id;
                const count = counts[opt.id] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={Boolean(votedOption) || busyId === poll.id}
                    onClick={() => void vote(poll.id, opt.id)}
                    className={
                      "relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left text-sm font-medium transition " +
                      (selected
                        ? "border-istin-blue bg-istin-blue/5 text-istin-blue"
                        : "border-border bg-white hover:border-istin-blue/40 disabled:opacity-70")
                    }
                  >
                    {poll.results_public && votedOption && (
                      <span
                        className="absolute inset-y-0 left-0 bg-istin-blue/10"
                        style={{ width: pct + "%" }}
                      />
                    )}
                    <span className="relative flex items-center justify-between gap-3">
                      <span>{opt.label}</span>
                      {poll.results_public && votedOption && (
                        <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {votedOption && (
              <p className="mt-3 text-xs font-semibold text-istin-blue">Tu as déjà voté sur ce sondage.</p>
            )}
          </article>
        );
      })}

      {!polls.length && (
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-10 text-center shadow-sm">
          <h2 className="font-heading text-xl font-bold text-[#1c2733]">Aucun sondage ouvert</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Lorsqu’un vote sera lancé par le bureau de la mutuelle, il apparaîtra ici.
          </p>
        </section>
      )}
    </div>
  );
}
