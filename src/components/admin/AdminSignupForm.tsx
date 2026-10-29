"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminSignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La configuration Supabase n’est pas disponible.");
      return;
    }

    setBusy(true);
    const normalizedCode = accessCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          access_code: normalizedCode,
        },
      },
    });

    if (signUpError) {
      setBusy(false);
      const msg = signUpError.message || "";
      if (msg.includes("Code") || msg.includes("invalide") || msg.includes("utilisé")) {
        setError("Code administrateur invalide, expiré ou déjà utilisé.");
      } else if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        setError("Un compte existe déjà avec cet e-mail. Connecte-toi puis active un code si besoin.");
      } else {
        setError(msg || "Impossible de créer le compte administrateur.");
      }
      return;
    }

    if (!data.user) {
      setBusy(false);
      setError("Création du compte incomplète. Réessaie.");
      return;
    }

    // Vérifie le rôle admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .in("role", ["admin", "superadmin"])
      .limit(1);

    setBusy(false);
    if (!roles?.length) {
      setError(
        "Compte créé mais le rôle administrateur n’a pas été attribué. Vérifie le code et le script setup_admin_invites.sql.",
      );
      return;
    }

    setNotice("Compte administrateur créé. Redirection…");
    window.location.assign("/admin");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <label className="block text-sm font-medium">
        Nom complet
        <input
          placeholder="Ex. Jean Mbadinga"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-border px-4"
        />
      </label>
      <label className="block text-sm font-medium">
        Adresse e-mail
        <input
          placeholder="Ex. prenom.nom@gmail.com"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-border px-4"
        />
      </label>
      <label className="block text-sm font-medium">
        Code d’invitation administrateur
        <input
          required
          autoComplete="off"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          className="mt-1 h-12 w-full rounded-xl border border-border px-4 font-mono tracking-wider"
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
        />
      </label>
      <label className="block text-sm font-medium">
        Mot de passe
        <input
          placeholder="8 caractères minimum"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-border px-4"
        />
      </label>
      <label className="block text-sm font-medium">
        Confirmer le mot de passe
        <input
          placeholder="Retape le même mot de passe"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-border px-4"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {notice}
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Le code est fourni par un administrateur existant. Il est vérifié par la base et ne peut pas
        dépasser son nombre d’utilisations.
      </p>
      <button disabled={busy} className="w-full rounded-xl bg-istin-blue px-5 py-3 text-sm font-semibold text-white hover:bg-istin-blue-dark disabled:opacity-60">
        {busy ? "Création du compte…" : "Créer mon compte administrateur"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/admin/connexion" className="font-semibold text-istin-blue hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
