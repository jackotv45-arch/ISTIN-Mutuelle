import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getEditableSection } from "@/lib/site-settings";
import { CommitteeCard } from "@/components/ui/CommitteeCard";

export const metadata = { title: "Bureau", description: "Présentation du bureau de la mutuelle étudiante ISTIN." };

export default async function BureauPage() {
  const section = await getEditableSection("bureau");
  return <><Header /><main className="flex-1">
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#062a4a] via-[#0b4777] to-[#0b63ab] pb-24 pt-36 text-white">
      <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-96 w-96 rounded-full border-[48px] border-white/5" />
      <div className="pointer-events-none absolute -bottom-32 left-[38%] -z-10 h-80 w-80 rounded-full bg-istin-red/20 blur-3xl" />
      <div className="mx-auto w-full max-w-7xl px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[.18em] text-white/85"><span className="h-1.5 w-1.5 rounded-full bg-[#ef5265]" />Gouvernance étudiante</span>
        <h1 className="mt-5 max-w-4xl font-heading text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Une équipe engagée<br className="hidden sm:block" /> au service des étudiants.</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{section.intro}</p>
      </div>
    </section>
    <section className="-mt-12 pb-20">
      <div className="mx-auto w-full max-w-7xl px-6">
        {section.items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{section.items.map((member) => <CommitteeCard key={member.id} member={member} />)}</div> : <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-[0_14px_35px_rgba(6,42,74,0.07)] sm:p-14"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-istin-blue/10 text-istin-blue"><svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 6.8M17 14a5.5 5.5 0 0 1 4.5 5.5" /></svg></div><h2 className="mt-5 font-heading text-2xl font-bold text-[#1c2733]">Aucune composition publiée</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">Les membres du bureau et leurs responsabilités seront présentés ici dès que les informations officielles seront disponibles.</p></div>}
      </div>
    </section>
  </main><Footer /></>;
}