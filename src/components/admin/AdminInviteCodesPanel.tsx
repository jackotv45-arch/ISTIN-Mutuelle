"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/DatePicker";

type AccessCode = {
  id: string;
  code: string;
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
  target_role?: string;
};

function displayCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

function codeState(code: AccessCode) {
  if (!code.is_active) return "Désactivé";
  if (code.uses_count >= code.max_uses) return "Utilisé";
  if (code.expires_at && Date.parse(code.expires_at) <= Date.now()) return "Expiré";
  return "Actif";
}

export function AdminInviteCodesPanel() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [newCodes, setNewCodes] = useState<Array<Pick<AccessCode, "id" | "code" | "max_uses" | "expires_at" | "note">>>([]);
  const [count, setCount] = useState("1");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresOn, setExpiresOn] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Connexion Supabase indisponible.");
      setLoading(false);
      return;
    }
    const { data, error: loadError } = await supabase
      .from("access_codes")
      .select("id,code,max_uses,uses_count,expires_at,is_active,note,created_at,target_role")
      .eq("target_role", "admin")
      .order("created_at", { ascending: false })
      .limit(100);

    if (loadError) {
      setError(
        "Exécute supabase/setup_admin_invites.sql dans le SQL Editor Supabase pour activer les invitations administrateur.",
      );
      setCodes([]);
    } else {
      setCodes((data as AccessCode[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCodes(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setNewCodes([]);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Connexion Supabase indisponible.");
      setBusy(false);
      return;
    }
    const expiresAt = expiresOn ? new Date(`${expiresOn}T23:59:59`).toISOString() : null;
    const { data, error: createError } = await supabase.rpc("create_admin_access_codes", {
      p_count: Number(count),
      p_max_uses: Number(maxUses),
      p_expires_at: expiresAt,
      p_note: note.trim() || null,
    });
    if (createError) {
      setError(createError.message || "Impossible de créer les codes administrateur.");
    } else {
      setNewCodes(data ?? []);
      setNotice(`${(data ?? []).length} code(s) administrateur généré(s). Transmets-les hors de la plateforme.`);
      setNote("");
      await load();
    }
    setBusy(false);
  }

  async function revoke(id: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from("access_codes")
      .update({ is_active: false })
      .eq("id", id);
    if (updateError) setError(updateError.message);
    else await load();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Invitations</p>
        <h2 className="mt-1 font-heading text-2xl font-bold">Codes administrateur</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Génère un code unique, donne-le à la personne concernée. Elle crée son compte sur la page
          d’inscription administrateur avec son e-mail, son mot de passe et ce code. Le code est
          consommé à la création du compte.
        </p>
      </div>

      <form onSubmit={createCodes} className="grid gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <label className="block text-sm font-medium">
          Nombre de codes
          <input
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="datetime-field mt-1"
          />
        </label>
        <label className="block text-sm font-medium">
          Utilisations max (recommandé : 1)
          <input
            type="number"
            min={1}
            max={5}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="datetime-field mt-1"
          />
        </label>
        <label className="block text-sm font-medium">
          Date d’expiration (facultatif)
          <DatePicker
            value={expiresOn}
            onChange={setExpiresOn}
            placeholder="Aucune date limite"
            className="mt-1"
          />
        </label>
        <label className="block text-sm font-medium">
          Note interne (facultatif)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={120}
            placeholder="Ex. Pour le trésorier"
            className="datetime-field mt-1"
          />
        </label>
        <div className="sm:col-span-2">
          <button disabled={busy} className="btn btn-primary disabled:opacity-60">
            {busy ? "Génération…" : "Générer le(s) code(s)"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {notice}
        </p>
      )}

      {newCodes.length > 0 && (
        <div className="rounded-2xl border border-istin-blue/20 bg-[#eef5fb] p-5">
          <p className="text-sm font-semibold text-istin-blue">Codes à transmettre</p>
          <ul className="mt-3 space-y-2 font-mono text-sm tracking-wider">
            {newCodes.map((item) => (
              <li key={item.id} className="rounded-lg bg-white px-3 py-2 shadow-sm">
                {displayCode(item.code)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="font-heading text-lg font-bold">Codes administrateur existants</h3>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>
        ) : codes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucun code administrateur pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {codes.map((code) => (
              <li
                key={code.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-mono text-sm tracking-wider">{displayCode(code.code)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {codeState(code)} · {code.uses_count}/{code.max_uses} utilisation(s)
                    {code.note ? ` · ${code.note}` : ""}
                  </p>
                </div>
                {code.is_active && code.uses_count < code.max_uses && (
                  <button
                    type="button"
                    onClick={() => void revoke(code.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Désactiver
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
