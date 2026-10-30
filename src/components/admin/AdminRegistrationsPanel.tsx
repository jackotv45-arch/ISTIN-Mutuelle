"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  location: string | null;
  status: string;
  registration_enabled: boolean;
};

type RegistrationRow = {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: string;
};

type StudentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  student_id: string | null;
  program: string | null;
  study_year: string | null;
};

type Participant = RegistrationRow & { profile: StudentProfile | null };

const eventStatusLabel: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  full: "Complet",
  ended: "Terminé",
  cancelled: "Annulé",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Libreville",
  });
}

export function AdminRegistrationsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
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

    const [eventsResult, registrationsResult] = await Promise.all([
      supabase
        .from("events")
        .select("id,slug,title,starts_at,location,status,registration_enabled")
        .order("starts_at", { ascending: false }),
      supabase
        .from("event_registrations")
        .select("id,event_id,user_id,registered_at,status")
        .eq("status", "registered")
        .order("registered_at", { ascending: false }),
    ]);

    if (eventsResult.error || registrationsResult.error) {
      setEvents([]);
      setParticipants([]);
      setError("Impossible de charger les inscriptions. Vérifie les règles Supabase.");
      setLoading(false);
      return;
    }

    const eventRows = (eventsResult.data ?? []) as EventRow[];
    const registrationRows = (registrationsResult.data ?? []) as RegistrationRow[];
    setEvents(eventRows);
    setSelectedEventId((current) =>
      current === "all" || eventRows.some((event) => event.id === current) ? current : "all",
    );

    const userIds = [...new Set(registrationRows.map((registration) => registration.user_id))];
    let profiles: StudentProfile[] = [];
    if (userIds.length) {
      const { data, error: profilesError } = await supabase
        .from("profiles")
        .select("id,full_name,email,student_id,program,study_year")
        .in("id", userIds);
      if (profilesError) {
        setParticipants([]);
        setError("Les inscriptions sont chargées, mais l’accès aux profils des participants n’est pas autorisé. Exécute supabase/setup_admin_participation.sql.");
        setLoading(false);
        return;
      }
      profiles = (data ?? []) as StudentProfile[];
    }

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    setParticipants(
      registrationRows.map((registration) => ({
        ...registration,
        profile: profileById.get(registration.user_id) ?? null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleEvents = selectedEventId === "all"
    ? events
    : events.filter((event) => event.id === selectedEventId);
  const totalParticipants = participants.length;
  const eventsWithRegistration = events.filter((event) => event.registration_enabled).length;

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Participation</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold">Inscriptions aux événements</h1>
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
          Consulte les inscrits, leurs coordonnées et le nombre de participants pour chaque événement.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Inscriptions confirmées</p>
          <p className="mt-2 font-heading text-3xl font-bold text-[#062a4a]">{loading ? "—" : totalParticipants}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total des places réservées, tous événements confondus</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Événements avec l’option activée</p>
          <p className="mt-2 font-heading text-3xl font-bold text-[#062a4a]">{loading ? "—" : eventsWithRegistration}</p>
          <p className="mt-1 text-xs text-muted-foreground">Réglage d’inscription activé dans l’administration</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <label className="block max-w-xl text-sm font-semibold">
          Filtrer par événement
          <select
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 font-normal"
          >
            <option value="all">Tous les événements</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement des inscriptions…</p>}
      {!loading && !error && visibleEvents.map((event) => {
        const eventParticipants = participants.filter((participant) => participant.event_id === event.id);
        return (
          <article key={event.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="font-heading text-lg font-bold">{event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(event.starts_at)} · {event.location || "Lieu à préciser"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {eventStatusLabel[event.status] ?? event.status}
                  {event.registration_enabled ? " · Option activée" : " · Option désactivée"}
                </p>
              </div>
              <span className="rounded-full bg-[#eef5fb] px-3 py-1.5 text-sm font-bold text-[#0b63ab]">
                {eventParticipants.length} inscrit{eventParticipants.length === 1 ? "" : "s"}
              </span>
            </div>

            {eventParticipants.length ? (
              <ul className="divide-y divide-border">
                {eventParticipants.map((participant) => {
                  const profile = participant.profile;
                  const name = profile?.full_name?.trim() || profile?.email || "Étudiant";
                  const studies = [profile?.program, profile?.study_year].filter(Boolean).join(" · ");
                  return (
                    <li key={participant.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                        <p className="mt-0.5 break-all text-xs text-muted-foreground">
                          {[profile?.email, profile?.student_id ? `N° ${profile.student_id}` : null].filter(Boolean).join(" · ") || "Coordonnées indisponibles"}
                        </p>
                        {studies && <p className="mt-0.5 text-xs text-muted-foreground">{studies}</p>}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        Inscrit le {new Date(participant.registered_at).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Africa/Libreville",
                        })}
                      </time>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">
                {event.registration_enabled ? "Aucun étudiant inscrit pour le moment." : "Aucune inscription. Active l’option dans le formulaire de l’événement pour ouvrir les inscriptions."}
              </p>
            )}
          </article>
        );
      })}

      {!loading && !error && !events.length && (
        <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
          Aucun événement enregistré.
        </p>
      )}
    </section>
  );
}
