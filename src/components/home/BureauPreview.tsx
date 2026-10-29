import Link from "next/link";
import { getEditableSection } from "@/lib/site-settings";
import { CommitteeCard } from "@/components/ui/CommitteeCard";

export async function BureauPreview() {
  const section = await getEditableSection("bureau");
  return <section className="section relative isolate overflow-hidden bg-[#f4f7fb]">
    <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-istin-blue/10 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-36 -left-24 -z-10 h-80 w-80 rounded-full bg-istin-red/10 blur-3xl" />
    <div className="mx-auto w-full max-w-7xl px-6">
      <div className="mb-10 grid items-end gap-6 md:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-istin-blue/15 bg-white/80 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-istin-blue shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-istin-red" />Gouvernance étudiante</span>
          <h2 className="mt-5 font-heading text-3xl font-black leading-tight tracking-tight text-[#182633] sm:text-4xl lg:text-[2.8rem]">Des visages engagés,<br className="hidden sm:block" /> une mutuelle qui vous ressemble.</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{section.intro}</p>
        </div>
        <Link href="/bureau" className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#062a4a] px-5 text-sm font-bold text-white shadow-lg shadow-[#062a4a]/15 transition hover:-translate-y-0.5 hover:bg-istin-blue">Découvrir le bureau <span aria-hidden="true">→</span></Link>
      </div>
      <p className="mb-6 font-heading text-lg font-bold text-[#213244]">L’équipe de la mutuelle</p>
      {section.items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{section.items.slice(0, 4).map((member) => <CommitteeCard key={member.id} member={member} compact />)}</div> : <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm sm:flex-row sm:gap-5 sm:p-9 sm:text-left"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-istin-blue/10 text-istin-blue"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 6.8M17 14a5.5 5.5 0 0 1 4.5 5.5" /></svg></span><span><strong className="mt-4 block font-heading text-lg text-[#213244] sm:mt-0">Aucune composition publiée</strong><span className="mt-1 block text-sm text-slate-500">Les membres du bureau seront présentés ici dès que leurs informations seront disponibles.</span></span></div>}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-2xl border border-white/80 bg-white/65 px-5 py-4 text-xs font-bold uppercase tracking-[.14em] text-slate-500"><span>Écoute</span><span className="h-1 w-1 rounded-full bg-istin-red" /><span>Solidarité</span><span className="h-1 w-1 rounded-full bg-istin-blue" /><span>Engagement étudiant</span></div>
    </div>
  </section>;
}