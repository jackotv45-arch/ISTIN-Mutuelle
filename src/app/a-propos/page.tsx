import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export const metadata = { title: "À propos" };
export default function AProposPage() {
  return <><Header /><main className="flex-1 pt-36 pb-16"><div className="container-main max-w-3xl">
    <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-istin-blue">La mutuelle</p><h1 className="mb-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Une communauté étudiante à construire ensemble</h1>
    <div className="space-y-5 leading-relaxed text-muted-foreground"><p>La plateforme de la Mutuelle ISTIN rassemble les informations, les actualités et l’agenda destinés à la communauté étudiante.</p><p>Les responsables de la mutuelle publient les informations institutionnelles et les activités au fur et à mesure de leur validation.</p><p>Les services numériques sont ouverts progressivement. Les informations non encore publiées ne sont pas remplacées par des données estimées.</p></div>
    <div className="mt-10 grid gap-4 sm:grid-cols-2"><Link href="/bureau" className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-istin-blue/40"><p className="font-heading font-semibold">Bureau de la mutuelle</p><p className="mt-1 text-sm text-muted-foreground">Consulter les informations publiées par les responsables.</p></Link><Link href="/contact" className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-istin-blue/40"><p className="font-heading font-semibold">Contact</p><p className="mt-1 text-sm text-muted-foreground">Voir les moyens de contact disponibles.</p></Link></div>
  </div></main><Footer /></>;
}
