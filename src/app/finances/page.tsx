import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getEditableSection } from "@/lib/site-settings";

export default async function FinancesPage() {
  const section = await getEditableSection("finances");
  return <><Header /><main className="flex-1 pt-36 pb-16"><div className="container-main max-w-5xl">
    <div className="mb-9"><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">Transparence</p><h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Finances de la mutuelle</h1><p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{section.intro}</p></div>
    {section.items.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{section.items.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-istin-blue">{item.title}</p><p className="mt-3 font-heading text-3xl font-bold">{item.value || "—"}</p>{item.details && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.details}</p>}</article>)}</div> : <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f2f7fb] p-8 text-center shadow-sm sm:p-12"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-istin-blue/10 text-istin-blue"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18v13H3z" /><path d="M3 10h18M7 15h4" /><path d="M7 7V4h13v3" /></svg></div><h2 className="mt-4 font-heading text-xl font-bold">Aucune donnée financière publiée</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Les informations seront affichées ici après leur vérification et leur validation par les responsables.</p></section>}
  </div></main><Footer /></>;
}