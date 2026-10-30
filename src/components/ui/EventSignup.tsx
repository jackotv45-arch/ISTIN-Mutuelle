"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Phase = "closed" | "checking" | "login" | "not_student" | "open" | "registered" | "error";

export function EventSignup({ eventId, eventSlug, enabled }: { eventId?: string; eventSlug: string; enabled: boolean }) {
  const [phase, setPhase] = useState<Phase>(enabled ? "checking" : "closed");
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!enabled) {
      setPhase("closed");
      return;
    }
    if (!eventId) {
      setPhase("error");
      setErrorMessage("Cette fiche ne permet pas de vérifier l’inscription.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setPhase("error");
      setErrorMessage("Le service d’inscription n’est pas configuré.");
      return;
    }

    let active = true;
    async function loadRegistration() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError) {
        setPhase("error");
        setErrorMessage("Impossible de vérifier ton compte. Réessaie dans un instant.");
        return;
      }
      if (!user) {
        setPhase("login");
        return;
      }

      setUserId(user.id);
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "student")
        .limit(1);
      if (!active) return;
      if (roleError) {
        setPhase("error");
        setErrorMessage("Impossible de vérifier les droits de ton compte.");
        return;
      }
      if (!roles?.length) {
        setPhase("not_student");
        return;
      }

      const { data: registration, error: registrationError } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (registrationError) {
        setPhase("error");
        setErrorMessage("Les inscriptions ne sont pas encore configurées pour cet événement.");
        return;
      }
      setPhase(registration ? "registered" : "open");
    }

    void loadRegistration();
    return () => {
      active = false;
    };
  }, [enabled, eventId]);

  async function register() {
    if (!eventId || !userId) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setErrorMessage("");
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: userId,
    });
    setBusy(false);

    if (error?.code === "23505") {
      setPhase("registered");
      return;
    }
    if (error) {
      setPhase("error");
      setErrorMessage("L’inscription n’a pas pu être enregistrée. Vérifie que les inscriptions sont toujours ouvertes.");
      return;
    }
    setPhase("registered");
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-semibold text-foreground">Inscription à l’événement</p>
      {phase === "closed" && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Les inscriptions en ligne ne sont pas ouvertes pour cet événement.
        </p>
      )}
      {phase === "checking" && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Vérification de ton accès…</p>
      )}
      {phase === "login" && (
        <div className="mt-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Connecte-toi à ton espace étudiant pour pouvoir t’inscrire.
          </p>
          <Link href={`/connexion?next=${encodeURIComponent(`/evenements/${eventSlug}`)}`} className="mt-3 inline-flex rounded-lg bg-istin-blue px-4 py-2 text-sm font-semibold text-white">
            Se connecter
          </Link>
        </div>
      )}
      {phase === "not_student" && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          L’inscription est réservée aux étudiants connectés à leur espace.
        </p>
      )}
      {phase === "open" && (
        <div className="mt-3">
          <p className="text-xs leading-relaxed text-muted-foreground">Les inscriptions sont ouvertes.</p>
          <button
            type="button"
            onClick={() => void register()}
            disabled={busy}
            className="mt-3 inline-flex rounded-lg bg-istin-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Inscription…" : "M’inscrire"}
          </button>
        </div>
      )}
      {phase === "registered" && (
        <p role="status" className="mt-2 text-xs font-medium leading-relaxed text-emerald-800">
          Ton inscription est confirmée. Tu peux la retrouver dans « Mes inscriptions ».
        </p>
      )}
      {phase === "error" && (
        <p role="alert" className="mt-2 text-xs leading-relaxed text-red-800">
          {errorMessage || "Une erreur est survenue."}
        </p>
      )}
    </div>
  );
}
