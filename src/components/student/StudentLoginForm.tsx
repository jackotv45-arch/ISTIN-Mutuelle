"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function StudentLoginForm({ reason }: { reason?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La connexion n’est pas configurée pour le moment. Contacte l’administration de la mutuelle.");
      return;
    }
    setBusy(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setBusy(false);
      setError("Connexion impossible. Vérifie ton adresse e-mail et ton mot de passe.");
      return;
    }
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "student")
      .limit(1);
    if (roleError || !roles?.length) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("Ce compte n’a pas encore l’accès étudiant. Inscris-toi avec une invitation fournie par la mutuelle.");
      return;
    }
    // Navigation complète pour laisser le navigateur enregistrer les cookies de session
    window.location.assign("/espace");
  }

  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
    {reason === "student" && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">L’accès à l’espace étudiant nécessite un compte activé par invitation.</p>}
    {reason === "setup" && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">La base Supabase des étudiants doit être configurée par l’administration.</p>}
    <label className="block text-sm font-medium">Adresse e-mail<input placeholder="Ex. prenom.nom@gmail.com" type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    <label className="block text-sm font-medium">Mot de passe<input placeholder="Ton mot de passe (8 caractères minimum)" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-istin-blue px-5 py-3 text-sm font-semibold text-white hover:bg-istin-blue-dark disabled:opacity-60">{busy ? "Connexion…" : "Se connecter"}</button>
    <div className="flex flex-wrap justify-between gap-3 text-sm"><Link href="/mot-de-passe-oublie" className="font-semibold text-istin-blue hover:underline">Mot de passe oublié ?</Link><Link href="/inscription" className="font-semibold text-istin-blue hover:underline">Créer un compte</Link></div>
  </form>;
}