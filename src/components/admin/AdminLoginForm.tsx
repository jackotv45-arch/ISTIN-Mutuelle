"use client";

import { IstinLogo } from "@/components/ui/IstinLogo";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm({ accessDenied = false }: { accessDenied?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showRedeem, setShowRedeem] = useState(accessDenied);
  const [redeemEmail, setRedeemEmail] = useState("");
  const [redeemPassword, setRedeemPassword] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemNotice, setRedeemNotice] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("La configuration Supabase n’a pas été chargée. Redémarre le serveur local.");
      return;
    }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setBusy(false);
      setError("Connexion impossible. Vérifie l’adresse et le mot de passe.");
      return;
    }

    window.location.assign("/admin");
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedeemError("");
    setRedeemNotice("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setRedeemError("La configuration Supabase n’a pas été chargée.");
      return;
    }

    const code = redeemCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!code) {
      setRedeemError("Indique le code administrateur.");
      return;
    }

    setRedeemBusy(true);

    // S’assurer d’être connecté (compte existant)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      if (!redeemEmail.trim() || !redeemPassword) {
        setRedeemBusy(false);
        setRedeemError("Connecte-toi avec ton e-mail et ton mot de passe, puis active le code.");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: redeemEmail.trim(),
        password: redeemPassword,
      });
      if (signInError) {
        setRedeemBusy(false);
        setRedeemError("Connexion impossible. Vérifie l’e-mail et le mot de passe de ton compte existant.");
        return;
      }
    }

    const { error: redeemRpcError } = await supabase.rpc("redeem_admin_invite_code", {
      p_code: code,
    });

    if (redeemRpcError) {
      setRedeemBusy(false);
      const msg = redeemRpcError.message || "";
      if (msg.includes("invalide") || msg.includes("expiré") || msg.includes("utilisé")) {
        setRedeemError("Code administrateur invalide, expiré ou déjà utilisé.");
      } else if (msg.includes("setup_admin_invites") || msg.includes("function") || msg.includes("does not exist")) {
        setRedeemError("La fonction d’activation n’est pas installée. Exécute setup_admin_invites.sql dans Supabase.");
      } else {
        setRedeemError(msg || "Impossible d’activer le code administrateur.");
      }
      return;
    }

    setRedeemNotice("Rôle administrateur activé. Redirection…");
    window.location.assign("/admin");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f8fb] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-border bg-white p-7 shadow-xl sm:p-9">
        <div className="inline-flex items-center">
          <IstinLogo className="h-12" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-istin-blue">
          ISTIN MUTUELLE
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold">Connexion administration</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Connecte-toi avec un compte administrateur.
        </p>

        {accessDenied && (
          <div role="alert" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Ce compte n’a pas encore le rôle administrateur. Si tu as reçu un code, active-le ci-dessous.
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Adresse e-mail
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border px-4"
            />
          </label>
          <label className="block text-sm font-medium">
            Mot de passe
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border px-4"
            />
          </label>
          <button disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => setShowRedeem((v) => !v)}
            className="w-full text-left text-sm font-semibold text-istin-blue hover:underline"
          >
            {showRedeem ? "Masquer" : "J’ai déjà un compte, j’active mon code admin"}
          </button>

          {showRedeem && (
            <form onSubmit={redeem} className="mt-4 space-y-3 rounded-2xl border border-border bg-slate-50 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Pour un compte déjà créé (par ex. étudiant) : connecte-toi ici avec ce compte, puis
                saisis le code fourni par un administrateur.
              </p>
              <label className="block text-sm font-medium">
                E-mail du compte existant
                <input
                  type="email"
                  autoComplete="username"
                  value={redeemEmail}
                  onChange={(e) => setRedeemEmail(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3"
                  placeholder="Ex. prenom.nom@gmail.com"
                />
              </label>
              <label className="block text-sm font-medium">
                Mot de passe
                <input
                  type="password"
                  autoComplete="current-password"
                  value={redeemPassword}
                  onChange={(e) => setRedeemPassword(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Code administrateur
                <input
                  required
                  autoComplete="off"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 font-mono tracking-wider"
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                />
              </label>
              {redeemError && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                  {redeemError}
                </p>
              )}
              {redeemNotice && (
                <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  {redeemNotice}
                </p>
              )}
              <button
                disabled={redeemBusy}
                className="w-full rounded-xl bg-[#062a4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3a66] disabled:opacity-60"
              >
                {redeemBusy ? "Activation…" : "Activer le code admin"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nouveau compte avec code ?{" "}
          <Link href="/admin/inscription" className="font-semibold text-istin-blue hover:underline">
            Créer un compte admin
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-semibold text-istin-blue hover:underline">
            ← Retour au site
          </Link>
        </p>
      </section>
    </main>
  );
}
