"use client";
import { DatePicker } from "@/components/ui/DatePicker";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccessCode = { id: string; code: string; max_uses: number; uses_count: number; expires_at: string | null; is_active: boolean; note: string | null; created_at: string };
function displayCode(code: string) { return code.match(/.{1,4}/g)?.join("-") ?? code; }
function codeState(code: AccessCode) {
  if (!code.is_active) return "Désactivé";
  if (code.uses_count >= code.max_uses) return "Utilisé";
  if (code.expires_at && Date.parse(code.expires_at) <= Date.now()) return "Expiré";
  return "Disponible";
}

export function AdminAccessCodesPanel() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [newCodes, setNewCodes] = useState<Array<Pick<AccessCode, "id" | "code" | "max_uses" | "expires_at" | "note">>>([]);
  const [count, setCount] = useState("1");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresOn, setExpiresOn] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("La configuration Supabase n’est pas disponible."); return; }
    const { data, error: loadError } = await supabase.from("access_codes").select("id,code,max_uses,uses_count,expires_at,is_active,note,created_at,target_role").eq("target_role", "student").order("created_at", { ascending: false }).limit(100);
    if (loadError) { setError("Exécute supabase/setup_student_access.sql dans le SQL Editor pour activer la gestion des invitations."); return; }
    setError(""); setCodes((data ?? []) as AccessCode[]);
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("La configuration Supabase n’est pas disponible."); setBusy(false); return; }
    const expiresAt = expiresOn ? expiresOn + "T23:59:59+01:00" : null;
    const { data, error: createError } = await supabase.rpc("create_student_access_codes", { p_count: Number(count), p_max_uses: Number(maxUses), p_expires_at: expiresAt, p_note: note.trim() || null });
    setBusy(false);
    if (createError || !data) { setError(createError?.message.toLowerCase().includes("function") ? "Exécute supabase/setup_student_access.sql dans le SQL Editor." : "Les codes n’ont pas pu être créés. Vérifie le compte administrateur et les paramètres saisis."); return; }
    const created = data as Array<Pick<AccessCode, "id" | "code" | "max_uses" | "expires_at" | "note">>;
    setNewCodes(created); setNotice(created.length + " code(s) créé(s). Copie-les et transmets-les aux étudiants concernés.");
    setCount("1"); setMaxUses("1"); setExpiresOn(""); setNote(""); await reload();
  }
  async function copyCode(code: string) {
    try { await navigator.clipboard.writeText(displayCode(code)); setNotice("Code copié."); }
    catch { setNotice("Sélectionne le code affiché puis copie-le."); }
  }
  async function deactivate(item: AccessCode) {
    const supabase = createSupabaseBrowserClient(); if (!supabase) return;
    const { error: updateError } = await supabase.from("access_codes").update({ is_active: false }).eq("id", item.id);
    if (updateError) { setError("Ce code n’a pas pu être désactivé."); return; }
    setNotice("Code désactivé. Il ne pourra plus servir à créer un compte."); setNewCodes((current) => current.filter((code) => code.id !== item.id)); await reload();
  }
  return <section className="space-y-5">
    <div className="rounded-2xl border border-border bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-istin-blue">Accès étudiants</p><h1 className="mt-1 font-heading text-2xl font-bold">Codes d’invitation</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Crée un code individuel ou une invitation à plusieurs utilisations. Chaque étudiant l’utilise pour créer son propre compte avec son adresse e-mail et son mot de passe. Le code ne sert pas de mot de passe de connexion.</p></div>
    <form onSubmit={generate} className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-sm font-medium">Nombre de codes<input placeholder="Ex. 20" type="number" min="1" max="100" required value={count} onChange={(e) => setCount(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border px-3" /></label>
      <label className="text-sm font-medium">Utilisations par code<input placeholder="Ex. 1" type="number" min="1" max="500" required value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border px-3" /><span className="mt-1 block text-xs text-muted-foreground">1 = un seul compte étudiant</span></label>
      <label className="text-sm font-medium">Expiration (facultative)<DatePicker value={expiresOn} onChange={setExpiresOn} placeholder="Aucune date limite" className="mt-1" /></label>
      <label className="text-sm font-medium">Note interne (facultative)<input maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-border px-3" placeholder="Ex. rentrée 2026" /></label>
      <div className="sm:col-span-2 xl:col-span-4"><button disabled={busy} className="btn btn-primary disabled:opacity-60">{busy ? "Création…" : "Générer les codes"}</button></div>
    </form>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    {!!newCodes.length && <section className="rounded-2xl border border-istin-blue/20 bg-istin-blue/5 p-5"><h2 className="font-heading font-bold">Codes à transmettre</h2><p className="mt-1 text-xs text-muted-foreground">Copie-les maintenant et transmets chaque code uniquement à l’étudiant concerné.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{newCodes.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"><code className="select-all font-mono text-sm font-bold tracking-wider">{displayCode(item.code)}</code><button type="button" onClick={() => void copyCode(item.code)} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Copier</button></div>)}</div></section>}
    <section className="overflow-hidden rounded-2xl border border-border bg-white"><div className="border-b border-border p-5"><h2 className="font-heading font-bold">Invitations créées</h2><p className="mt-1 text-xs text-muted-foreground">Seuls les comptes administrateurs peuvent consulter et désactiver les invitations.</p></div>
      {codes.length ? <div className="divide-y divide-border">{codes.map((item) => { const status = codeState(item), usable = status === "Disponible"; return <article key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><code className="select-all font-mono text-sm font-bold tracking-wider">{displayCode(item.code)}</code><span className={"rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " + (usable ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground")}>{status}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.uses_count}/{item.max_uses} compte(s) créé(s){item.expires_at ? " · expire le " + new Date(item.expires_at).toLocaleDateString("fr-FR", { timeZone: "Africa/Libreville" }) : " · sans expiration"}{item.note ? " · " + item.note : ""}</p></div><div className="flex gap-2"><button type="button" onClick={() => void copyCode(item.code)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Copier</button>{item.is_active && <button type="button" disabled={!usable} onClick={() => void deactivate(item)} className="rounded-lg border border-istin-red/30 px-3 py-2 text-xs font-semibold text-istin-red disabled:opacity-40">Désactiver</button>}</div></article>;})}</div> : <p className="p-8 text-center text-sm text-muted-foreground">Aucune invitation créée.</p>}
    </section>
  </section>;
}
