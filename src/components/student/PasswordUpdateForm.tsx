"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function PasswordUpdateForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (password !== confirm) { setError(true); setNotice("Les deux mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = supabase ? await supabase.auth.updateUser({ password }) : { error: new Error("Configuration absente") };
    setBusy(false); setError(Boolean(updateError));
    if (updateError) { setNotice("Le mot de passe n’a pas pu être modifié. Rouvre le lien reçu par e-mail ou demande-en un nouveau."); return; }
    setNotice("Mot de passe modifié. Tu peux te connecter.");
    window.setTimeout(() => { router.replace("/connexion"); router.refresh(); }, 1200);
  }
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
    <label className="block text-sm font-medium">Nouveau mot de passe<input placeholder="8 caractères minimum" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    <label className="block text-sm font-medium">Confirmer le mot de passe<input placeholder="Retape le même mot de passe" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    {notice && <p role={error ? "alert" : "status"} className={"rounded-lg p-3 text-sm " + (error ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900")}>{notice}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-istin-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Enregistrement…" : "Enregistrer le mot de passe"}</button>
    <Link href="/connexion" className="block text-center text-sm font-semibold text-istin-blue hover:underline">Retour à la connexion</Link>
  </form>;
}
