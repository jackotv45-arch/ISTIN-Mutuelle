"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function StudentSignOutButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createSupabaseBrowserClient()?.auth.signOut();
    window.location.assign("/connexion");
  }

  const className =
    variant === "dark"
      ? "rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-60"
      : "rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60";

  return (
    <button type="button" disabled={busy} onClick={() => void signOut()} className={className}>
      {busy ? "Déconnexion…" : "Déconnexion"}
    </button>
  );
}
