"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NotificationType } from "@/lib/notifications";

export function StudentSignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8) {
      setError("Choisis un mot de passe d’au moins 8 caractères.");
      return;
    }
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La création de compte n’est pas configurée pour le moment.");
      return;
    }
    setBusy(true);
    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/connexion`,
        data: { full_name: fullName.trim(), access_code: accessCode.trim() },
      },
    });
    setBusy(false);
    if (signupError || !data.user) {
      setError("Création impossible. Vérifie l’invitation, son expiration et l’adresse e-mail utilisée.");
      return;
    }
    if (data.session) {
      // Notification de bienvenue (l'étudiant peut s'auto-notifier via RLS)
      await supabase.from("notifications").insert({
        user_id: data.user.id,
        title: "Bienvenue",
        body: "Ton espace étudiant ISTIN MUTUELLE est prêt.",
        link: "/espace",
        type: "account_welcome" satisfies NotificationType as string,
      });
      router.replace("/espace");
      router.refresh();
      return;
    }
    setNotice("Compte créé. Consulte ta boîte e-mail pour confirmer l’adresse, puis connecte-toi.");
  }

  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
    <label className="block text-sm font-medium">Nom complet<input placeholder="Ex. Amina Nguema" required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    <label className="block text-sm font-medium">Adresse e-mail<input placeholder="Ex. prenom.nom@gmail.com" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    <label className="block text-sm font-medium">Code d’invitation<input required autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase())} className="mt-1 h-12 w-full rounded-xl border border-border px-4 font-mono tracking-wider" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" /></label>
    <label className="block text-sm font-medium">Mot de passe<input placeholder="Ton mot de passe (8 caractères minimum)" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    <label className="block text-sm font-medium">Confirmer le mot de passe<input placeholder="Retape le même mot de passe" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 h-12 w-full rounded-xl border border-border px-4" /></label>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>}
    <p className="text-xs leading-relaxed text-muted-foreground">L’invitation est vérifiée par la base et ne peut pas dépasser son nombre d’utilisations. Ton mot de passe est géré par Supabase Auth.</p>
    <button disabled={busy} className="w-full rounded-xl bg-istin-blue px-5 py-3 text-sm font-semibold text-white hover:bg-istin-blue-dark disabled:opacity-60">{busy ? "Création du compte…" : "Créer mon compte étudiant"}</button>
    <p className="text-center text-sm text-muted-foreground">Tu as déjà un compte ? <Link href="/connexion" className="font-semibold text-istin-blue hover:underline">Se connecter</Link></p>
  </form>;
}