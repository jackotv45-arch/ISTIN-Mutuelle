"use client";
import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import { usePlatform } from "@/lib/platform-store";
import { AdminContentPanel } from "@/components/admin/AdminContentPanel";
import { AdminEventsPanel } from "@/components/admin/AdminEventsPanel";
import { AdminAccessCodesPanel } from "@/components/admin/AdminAccessCodesPanel";
import { AdminInviteCodesPanel } from "@/components/admin/AdminInviteCodesPanel";
import { AdminTicketsPanel } from "@/components/admin/AdminTicketsPanel";
import { AdminAuditPanel } from "@/components/admin/AdminAuditPanel";
import { AdminEditableSectionPanel } from "@/components/admin/AdminEditableSectionPanel";
import { AdminProposalsPanel } from "@/components/admin/AdminProposalsPanel";
import { AdminPollsPanel } from "@/components/admin/AdminPollsPanel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EditableSectionKey } from "@/lib/admin-sections";

type Tab = "Vue d’ensemble" | "Contenus" | "Événements" | "Codes étudiants" | "Codes admin" | "Finances" | "Inscriptions" | "Propositions" | "Sondages" | "Médias" | "Bureau" | "Rapports" | "Demandes" | "Journal" | "Paramètres";
const nav: Tab[] = ["Vue d’ensemble", "Contenus", "Événements", "Codes étudiants", "Codes admin", "Finances", "Inscriptions", "Propositions", "Sondages", "Médias", "Bureau", "Rapports", "Demandes", "Journal", "Paramètres"];
const sectionForTab: Partial<Record<Tab, EditableSectionKey>> = {
  Finances: "finances",
  Inscriptions: "inscriptions",
  Médias: "medias",
  Bureau: "bureau",
  Rapports: "rapports",
  Paramètres: "parametres",
};

export function AdminDashboard({ adminEmail }: { adminEmail?: string }) {
  const { articles, events, newsConnection, newsError, eventConnection, eventError } = usePlatform();
  const [tab, setTab] = useState<Tab>("Vue d’ensemble");
  async function signOut() {
    await createSupabaseBrowserClient()?.auth.signOut();
    window.location.assign("/admin/connexion");
  }
  const editableSection = sectionForTab[tab];
  return <div className="min-h-screen bg-[#f5f8fb]">
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-[#062a4a] px-4 py-4 text-white shadow-lg sm:px-7">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Retour à l’accueil ISTIN" className="flex items-center gap-3 shrink-0">
          <Image
            src="/istin-logo-official.png"
            alt="Logo ISTIN"
            width={120}
            height={68}
            className="h-10 w-auto object-contain"
            priority
          />
          <span className="hidden sm:block leading-tight border-l border-white/20 pl-3">
            <span className="block font-heading font-black tracking-tight">MUTUELLE</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">ISTIN GABON · Admin</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3">{adminEmail && <span className="hidden max-w-48 truncate text-xs text-white/75 sm:block">{adminEmail}</span>}<button onClick={signOut} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10">Déconnexion</button><Link href="/" className="text-sm text-white/75 transition hover:text-white">← Retour au site</Link></div>
    </header>
    <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[230px_1fr] lg:px-7">
      <aside className="h-fit rounded-2xl border border-border bg-white p-3 shadow-sm lg:sticky lg:top-24">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Administration</p>
        <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Menu d’administration">
          {nav.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={"rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition " + (tab === item ? "bg-istin-blue text-white" : "text-slate-700 hover:bg-muted")}>{item}</button>)}
        </nav>
      </aside>
      <main className="min-w-0 space-y-5">
        {(newsConnection === "error" || eventConnection === "error") && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Connexion de contenu à vérifier.</strong><p className="mt-1">{newsConnection === "error" ? newsError : eventError}</p></div>}
        {tab === "Vue d’ensemble" && <section className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-br from-[#062a4a] to-[#0b63ab] p-6 text-white shadow-lg sm:p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-white/65">Espace de gestion</p><h1 className="mt-2 font-heading text-3xl font-bold">Bienvenue dans l’administration</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">Publie les informations de la mutuelle, gère l’agenda et délivre des invitations individuelles aux étudiants.</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><OverviewCard label="Actualités" value={newsConnection === "connected" ? String(articles.length) : "—"} hint={newsConnection === "connected" ? "enregistrées" : "connexion à vérifier"} onClick={() => setTab("Contenus")} /><OverviewCard label="Événements" value={eventConnection === "connected" ? String(events.length) : "—"} hint={eventConnection === "connected" ? "enregistrés" : "connexion à vérifier"} onClick={() => setTab("Événements")} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><h2 className="font-heading text-lg font-bold">Accès étudiants</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Génère des codes d’invitation dans « Codes étudiants ». Un étudiant utilise son code pour créer son compte avec son propre e-mail et son mot de passe.</p><button type="button" onClick={() => setTab("Codes étudiants")} className="btn btn-primary mt-4">Gérer les invitations</button></div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><h2 className="font-heading text-lg font-bold">Accès administrateurs</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Génère un code unique dans « Codes admin », puis donne-le à la personne qui créera son compte administrateur.</p><button type="button" onClick={() => setTab("Codes admin")} className="btn btn-primary mt-4">Gérer les codes admin</button></div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm"><h2 className="font-heading text-lg font-bold">Rubriques éditables</h2><p className="mt-1 text-sm text-muted-foreground">Consulte et modifie les informations enregistrées pour chaque rubrique.</p><div className="mt-4 flex flex-wrap gap-2">{nav.slice(4).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-istin-blue hover:text-istin-blue">{item}</button>)}</div></div>
        </section>}
        {tab === "Contenus" && <AdminContentPanel />}
        {tab === "Événements" && <AdminEventsPanel />}
        {tab === "Codes étudiants" && <AdminAccessCodesPanel />}
        {tab === "Codes admin" && <AdminInviteCodesPanel />}
        {tab === "Propositions" && <AdminProposalsPanel />}
        {tab === "Sondages" && <AdminPollsPanel />}
        {editableSection && tab !== "Demandes" && tab !== "Journal" && <AdminEditableSectionPanel key={editableSection} section={editableSection} />}
        {tab === "Demandes" && <AdminTicketsPanel />}
        {tab === "Journal" && <AdminAuditPanel />}
      </main>
    </div>
  </div>;
}
function OverviewCard({ label, value, hint, onClick }: { label: string; value: string; hint: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 font-heading text-3xl font-bold">{value}</p><span className="text-xs font-semibold text-istin-blue">{hint} · ouvrir →</span></button>;
}