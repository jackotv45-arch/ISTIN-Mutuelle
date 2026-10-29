import Link from "next/link";
import { getEditableSection } from "@/lib/site-settings";

export async function FinancePreview() {
  const finance = await getEditableSection("finances");
  return (
    <section className="section relative overflow-hidden bg-istin-blue-deeper text-background">
      <div className="container-main relative z-10">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="section-badge !border-background/20 !bg-background/10 !text-background">Transparence</span>
          <h2 className="mb-3 mt-4 font-heading text-3xl font-black tracking-normal text-background sm:text-4xl">Finances de la mutuelle</h2>
          <p className="leading-relaxed text-background/70">{finance.intro}</p>
        </div>
        {finance.items.length ? <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {finance.items.slice(0, 3).map((item) => <div key={item.id} className="rounded-lg border border-background/10 bg-background/5 p-6 text-center backdrop-blur-sm">
            <p className="mb-2 text-xs uppercase tracking-normal text-background/60">{item.title}</p>
            <p className="font-heading text-2xl font-black text-background/90">{item.value || "—"}</p>
            {item.details && <p className="mt-2 text-xs leading-relaxed text-background/55">{item.details}</p>}
          </div>)}
        </div> : <div className="mx-auto mb-8 max-w-3xl border-y border-background/15 py-7 text-center">
          <p className="font-heading text-lg font-bold">Aucune donnée financière publiée</p>
          <p className="mt-2 text-sm text-background/65">Les informations apparaîtront ici après validation par la mutuelle.</p>
        </div>}
        <div className="text-center"><Link href="/finances" className="btn btn-outline-light">Voir la page Finances</Link></div>
      </div>
    </section>
  );
}