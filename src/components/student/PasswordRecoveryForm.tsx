"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError(true); setNotice("La récupération n’est pas disponible. Contacte l’administration."); setBusy(false); return; }
    const redirectTo = window.location.origin + "/mot-de-passe/nouveau";
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setError(Boolean(requestError)); setNotice(requestError ? "Le message de récupération n’a pas pu être envoyé. Vérifie l’adresse et les paramètres de messagerie." : "Si un compte correspond à cette adresse, un lien de récupération vient d’être envoyé.");
    setBusy(false);
  }
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
    <p className="text-sm text-muted-foreground">Indique l’adresse e-mail associée à ton compte. Tu recevras un lien pour choisir un nouveau mot de passe.</p>
    <label className="block text-sm font-medium">Adresse e-mail<input placeholder="Ex. prenom.nom@gmail.com" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    {notice && <p role={error ? "alert" : "status"} className={"rounded-lg p-3 text-sm " + (error ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900")}>{notice}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-istin-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Envoi…" : "Envoyer le lien"}</button>
    <Link href="/connexion" className="block text-center text-sm font-semibold text-istin-blue hover:underline">← Retour à la connexion</Link>
  </form>;
}
